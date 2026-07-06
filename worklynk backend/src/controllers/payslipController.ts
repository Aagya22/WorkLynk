import { Response } from 'express';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { Payslip } from '../models/payslip.model';
import { User } from '../models/user.model';
import { Profile } from '../models/profile.model';
import { AuditLog } from '../models/audit-log.model';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const sanitizeInput = (text: string): string => {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
};

// Regex to validate YYYY-MM month format
const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const createPayslip = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role === 'employee') {
    return res.status(403).json({ message: 'Access denied: Employees cannot create payslips.' });
  }

  const {
    employeeId,
    month,
    basicSalary,
    overtimePay,
    bonus,
    taxDeduction,
    niDeduction,
    otherDeductions,
    notes
  } = req.body;

  if (!employeeId || !month || basicSalary === undefined || overtimePay === undefined || bonus === undefined || taxDeduction === undefined || niDeduction === undefined || otherDeductions === undefined) {
    return res.status(400).json({ message: 'All numeric salary fields, employee ID, and month are required.' });
  }

  // Validate month format (YYYY-MM)
  if (!monthRegex.test(month)) {
    return res.status(400).json({ message: 'Invalid month format. Please use YYYY-MM.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const employee = await User.findById(employeeId).session(session);
    if (!employee) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const duplicate = await Payslip.findOne({ employeeId, month }).session(session);
    if (duplicate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'A payslip for this employee and month already exists.' });
    }

    const basic = parseFloat(basicSalary);
    const overtime = parseFloat(overtimePay);
    const bns = parseFloat(bonus);
    const tax = parseFloat(taxDeduction);
    const ni = parseFloat(niDeduction);
    const other = parseFloat(otherDeductions);

    if (isNaN(basic) || isNaN(overtime) || isNaN(bns) || isNaN(tax) || isNaN(ni) || isNaN(other)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid numeric input values.' });
    }

    // Block negative values
    if (basic < 0 || overtime < 0 || bns < 0 || tax < 0 || ni < 0 || other < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Negative salary or deduction values are not permitted.' });
    }

    // Auto-calculate net salary and block negative net salary
    const net = basic + overtime + bns - (tax + ni + other);
    if (net < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Net salary cannot be negative. Please adjust deductions.' });
    }

    const payslip = new Payslip({
      employeeId,
      month,
      basicSalary: basic.toFixed(2),
      overtimePay: overtime.toFixed(2),
      bonus: bns.toFixed(2),
      taxDeduction: tax.toFixed(2),
      niDeduction: ni.toFixed(2),
      otherDeductions: other.toFixed(2),
      netSalary: net.toFixed(2),
      notes: sanitizeInput(notes),
      createdBy: req.user!._id
    });

    await payslip.save({ session });

    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    await AuditLog.create([{
      userId: req.user!._id,
      actionType: 'PAYSLIP_CREATION',
      targetResource: `payslip:${payslip._id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { targetEmployeeId: employeeId, month }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ message: 'Payslip created successfully.', payslip });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error processing payroll transaction:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const getPayslips = async (req: AuthenticatedRequest, res: Response) => {
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
  const isEmployee = req.user!.role === 'employee';

  try {
    let filter: any = {};
    if (isEmployee) {
      filter.employeeId = req.user!._id;
    } else if (req.query.employeeId) {
      const empExists = await User.findById(req.query.employeeId);
      if (!empExists) {
        return res.status(404).json({ message: 'Requested employee user does not exist.' });
      }
      filter.employeeId = req.query.employeeId;
    }

    const payslips = await Payslip.find(filter).sort({ month: -1 });

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'PAYSLIPS_LIST_VIEW',
      targetResource: isEmployee ? `employee:${req.user!._id}` : 'all',
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    return res.status(200).json({ payslips });
  } catch (error: any) {
    console.error('Error retrieving payslips:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const getPayslipById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const payslip = await Payslip.findById(id);
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found.' });
    }

    // IDOR Check
    if (req.user!.role === 'employee' && req.user!._id.toString() !== payslip.employeeId.toString()) {
      await AuditLog.create({
        userId: req.user!._id,
        actionType: 'UNAUTHORIZED_PAYSLIP_VIEW_ATTEMPT',
        targetResource: `payslip:${id}`,
        ipAddress: clientIP,
        userAgent: req.headers['user-agent'] || 'unknown'
      });
      return res.status(403).json({ message: 'Access denied: You cannot view this payslip.' });
    }

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'PAYSLIP_VIEW',
      targetResource: `payslip:${id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    return res.status(200).json({ payslip });
  } catch (error: any) {
    console.error('Error retrieving payslip:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const downloadPayslipPDF = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const payslip = await Payslip.findById(id);
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found.' });
    }

    // IDOR Check
    if (req.user!.role === 'employee' && req.user!._id.toString() !== payslip.employeeId.toString()) {
      await AuditLog.create({
        userId: req.user!._id,
        actionType: 'UNAUTHORIZED_PAYSLIP_PDF_DOWNLOAD_ATTEMPT',
        targetResource: `payslip:${id}`,
        ipAddress: clientIP,
        userAgent: req.headers['user-agent'] || 'unknown'
      });
      return res.status(403).json({ message: 'Access denied: You cannot download this payslip.' });
    }

    // Fetch user profile and email to avoid showing raw Mongo objectId
    const employeeUser = await User.findById(payslip.employeeId);
    const employeeProfile = await Profile.findOne({ userId: payslip.employeeId });
    const employeeName = employeeProfile ? employeeProfile.fullName : 'Employee';
    const employeeEmail = employeeUser ? employeeUser.email : 'N/A';

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'PAYSLIP_PDF_DOWNLOAD',
      targetResource: `payslip:${id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip-${payslip.month}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('Worklynk HR - Monthly Payslip', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Month: ${payslip.month}`);
    doc.text(`Employee Name: ${employeeName}`);
    doc.text(`Employee Email: ${employeeEmail}`);
    doc.moveDown();

    doc.text(`Basic Salary: £${payslip.basicSalary}`);
    doc.text(`Overtime Pay: £${payslip.overtimePay}`);
    doc.text(`Bonus: £${payslip.bonus}`);
    doc.moveDown();
    doc.text(`Tax Deduction: £${payslip.taxDeduction}`);
    doc.text(`National Insurance Deduction: £${payslip.niDeduction}`);
    doc.text(`Other Deductions: £${payslip.otherDeductions}`);
    doc.moveDown();
    doc.fontSize(14).text(`Net Salary: £${payslip.netSalary}`, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Notes: ${payslip.notes || 'N/A'}`);
    doc.moveDown();
    doc.fontSize(10).text(`Generated securely by Worklynk Server on ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.end();
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const updatePayslip = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Only Admins can modify payslips.' });
  }

  const { id } = req.params;
  const {
    basicSalary,
    overtimePay,
    bonus,
    taxDeduction,
    niDeduction,
    otherDeductions,
    notes,
    reason
  } = req.body;

  if (!reason) {
    return res.status(400).json({ message: 'A mandatory modification reason is required.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payslip = await Payslip.findById(id).session(session);
    if (!payslip) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Payslip not found.' });
    }

    // Keep old values for audit logging
    const oldValues = {
      basicSalary: payslip.basicSalary,
      overtimePay: payslip.overtimePay,
      bonus: payslip.bonus,
      taxDeduction: payslip.taxDeduction,
      niDeduction: payslip.niDeduction,
      otherDeductions: payslip.otherDeductions,
      netSalary: payslip.netSalary,
      notes: payslip.notes
    };

    const basic = basicSalary !== undefined ? parseFloat(basicSalary) : parseFloat(payslip.basicSalary);
    const overtime = overtimePay !== undefined ? parseFloat(overtimePay) : parseFloat(payslip.overtimePay);
    const bns = bonus !== undefined ? parseFloat(bonus) : parseFloat(payslip.bonus);
    const tax = taxDeduction !== undefined ? parseFloat(taxDeduction) : parseFloat(payslip.taxDeduction);
    const ni = niDeduction !== undefined ? parseFloat(niDeduction) : parseFloat(payslip.niDeduction);
    const other = otherDeductions !== undefined ? parseFloat(otherDeductions) : parseFloat(payslip.otherDeductions);

    if (isNaN(basic) || isNaN(overtime) || isNaN(bns) || isNaN(tax) || isNaN(ni) || isNaN(other)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid numeric input values.' });
    }

    if (basic < 0 || overtime < 0 || bns < 0 || tax < 0 || ni < 0 || other < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Negative salary or deduction values are not permitted.' });
    }

    const net = basic + overtime + bns - (tax + ni + other);
    if (net < 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Net salary cannot be negative.' });
    }

    payslip.basicSalary = basic.toFixed(2);
    payslip.overtimePay = overtime.toFixed(2);
    payslip.bonus = bns.toFixed(2);
    payslip.taxDeduction = tax.toFixed(2);
    payslip.niDeduction = ni.toFixed(2);
    payslip.otherDeductions = other.toFixed(2);
    payslip.netSalary = net.toFixed(2);
    if (notes !== undefined) payslip.notes = sanitizeInput(notes);

    await payslip.save({ session });

    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    await AuditLog.create([{
      userId: req.user!._id,
      actionType: 'PAYSLIP_UPDATE',
      targetResource: `payslip:${payslip._id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { reason: sanitizeInput(reason), oldValues }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: 'Payslip updated successfully.', payslip });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error updating payslip payroll transaction:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const deletePayslip = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Only Admins can delete payslips.' });
  }

  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ message: 'A mandatory deletion reason is required.' });
  }

  try {
    const payslip = await Payslip.findById(id);
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found.' });
    }

    await Payslip.findByIdAndDelete(id);

    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'PAYSLIP_DELETION',
      targetResource: `payslip:${id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { reason: sanitizeInput(reason), employeeId: payslip.employeeId, month: payslip.month }
    });

    return res.status(200).json({ message: 'Payslip deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting payslip:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};
