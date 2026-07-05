import dotenv from 'dotenv';

dotenv.config();

export const sendSecurityAlertEmail = (
  to: string,
  subject: string,
  text: string
): void => {
  console.warn(`
=========================================
[SECURITY ALERT EMAIL SENT]
Timestamp: ${new Date().toISOString()}
To: ${to}
Subject: ${subject}
Message:
${text}
=========================================
`);
};
