import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/user.model';
import { Profile } from '../models/profile.model';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedDB = async () => {
  const dbUri = process.env.DATABASE_URL;
  if (!dbUri) {
    console.error('DATABASE_URL is not defined in environment variables.');
    process.exit(1);
  }
  try {
    console.log('Connecting to database...');
    await mongoose.connect(dbUri);
    console.log('Database connected.');

    console.log('Clearing existing users and profiles...');
    await User.deleteMany({});
    await Profile.deleteMany({});

    console.log('No users found in database. Starting seeding process...');

    // 1. Create Admin
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error('SEED_ADMIN_PASSWORD is not defined in environment variables. Seeding aborted.');
      process.exit(1);
    }
    const adminHash = await bcrypt.hash(adminPassword, 12);
    const adminUser = await User.create({
      email: 'admin@worklynk.local',
      passwordHash: adminHash,
      role: 'admin',
      isActive: true,
      failedLoginCount: 0,
      sessionVersion: 1
    });

    await Profile.create({
      userId: adminUser._id,
      fullName: 'System Administrator',
      jobTitle: 'IT Admin',
      dateOfBirth: '1990-01-01',
      phoneNumber: '+44 7700 900077',
      emergencyContact: 'John Doe, Friend, +44 7700 900088',
      employmentStartDate: new Date('2025-01-01'),
      salary: '85000',
      bankAccount: 'Sort Code: 12-34-56, Account: 98765432'
    });

    console.log('\n----------------------------------------');
    console.log('ADMIN USER CREATED SUCCESSFULLY');
    console.log(`Email:    admin@worklynk.local`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role:     admin`);
    console.log('----------------------------------------');

    // 2. Create HR Manager
    const hrPassword = process.env.SEED_HR_PASSWORD;
    if (!hrPassword) {
      console.error('SEED_HR_PASSWORD is not defined in environment variables. Seeding aborted.');
      process.exit(1);
    }
    const hrHash = await bcrypt.hash(hrPassword, 12);
    const hrUser = await User.create({
      email: 'hr@worklynk.local',
      passwordHash: hrHash,
      role: 'hr_manager',
      isActive: true,
      department: 'HR',
      failedLoginCount: 0,
      sessionVersion: 1
    });

    await Profile.create({
      userId: hrUser._id,
      fullName: 'Sarah Jenkins',
      jobTitle: 'HR Director',
      dateOfBirth: '1985-05-15',
      phoneNumber: '+44 7700 900011',
      emergencyContact: 'Mark Jenkins, Spouse, +44 7700 900022',
      employmentStartDate: new Date('2025-02-01'),
      salary: '65000',
      bankAccount: 'Sort Code: 23-45-67, Account: 87654321'
    });

    console.log('\n----------------------------------------');
    console.log('HR MANAGER USER CREATED SUCCESSFULLY');
    console.log(`Email:    hr@worklynk.local`);
    console.log(`Password: ${hrPassword}`);
    console.log(`Role:     hr_manager`);
    console.log('----------------------------------------');

    // 3. Create a default Employee
    const employeePassword = process.env.SEED_EMPLOYEE_PASSWORD;
    if (!employeePassword) {
      console.error('SEED_EMPLOYEE_PASSWORD is not defined in environment variables. Seeding aborted.');
      process.exit(1);
    }
    const employeeHash = await bcrypt.hash(employeePassword, 12);
    const employeeUser = await User.create({
      email: 'employee@worklynk.local',
      passwordHash: employeeHash,
      role: 'employee',
      isActive: true,
      department: 'HR', // placed in same department to let HR manager view logs/slips
      failedLoginCount: 0,
      sessionVersion: 1
    });

    await Profile.create({
      userId: employeeUser._id,
      fullName: 'David Smith',
      jobTitle: 'HR Assistant',
      dateOfBirth: '1995-10-20',
      phoneNumber: '+44 7700 900055',
      emergencyContact: 'Jane Smith, Mother, +44 7700 900066',
      employmentStartDate: new Date('2025-03-01'),
      salary: '35000',
      bankAccount: 'Sort Code: 34-56-78, Account: 76543210'
    });

    console.log('\n----------------------------------------');
    console.log('EMPLOYEE USER CREATED SUCCESSFULLY');
    console.log(`Email:    employee@worklynk.local`);
    console.log(`Password: ${employeePassword}`);
    console.log(`Role:     employee`);
    console.log('----------------------------------------\n');

    console.log('Database seeding complete. Exiting.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
