import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export const sendSecurityAlertEmail = async (
  to: string,
  subject: string,
  text: string
): Promise<void> => {
  console.log(`[EMAIL QUEUED] To: ${to} | Subject: ${subject}`);

  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const mailOptions = {
      from: `Worklynk Security <${EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT SUCCESS] Alert delivered to ${to}`);
  } catch (error) {
    console.error('Failed to send security alert email:', error);
  }
};
