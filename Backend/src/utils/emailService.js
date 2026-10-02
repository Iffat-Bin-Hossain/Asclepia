const nodemailer = require('nodemailer');

/**
 * Configure email transporter
 * Uses SMTP settings from environment variables if provided
 */
const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback to test/log transport if SMTP is not configured in .env
  return null;
};

/**
 * Send a transactional email
 * @param {Object} options { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const fromAddress = process.env.SMTP_FROM || '"Asclepia Medical Portal" <security@asclepia.health>';

    if (transporter) {
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
      });
      console.log(`[Email Service] Real email dispatched to ${to} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`[Email Service] SMTP not configured. Simulating real email dispatch to ${to}:`);
      console.log(`  Subject: ${subject}`);
      console.log(`  To: ${to}`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error(`[Email Service Error] Failed sending email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email upon registration
 */
const sendWelcomeEmail = async (userEmail, userName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #070d14; color: #f0fdfa; padding: 40px 20px;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #0b151f; border: 1px solid rgba(165, 236, 235, 0.25); border-radius: 16px; padding: 32px;">
        <h1 style="color: #A5ECEB; font-size: 22px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">
          ASCLEPIA
        </h1>
        <p style="color: #94a3b8; font-size: 13px; margin-bottom: 24px;">Asclepia Administrative Portal</p>
        <p style="font-size: 15px; line-height: 1.6; color: #f0fdfa;">
          Hello <strong>${userName || 'Doctor'}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
          Your authorized administrative access credentials for Asclepia have been verified and activated.
        </p>
        <div style="margin: 28px 0; padding: 16px; background-color: #070d14; border-radius: 10px; border-left: 3px solid #A5ECEB;">
          <p style="margin: 0; font-size: 13px; color: #A5ECEB; font-weight: bold;">
            Account Status: Authorized & Active
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">
            Registered Email: ${userEmail}
          </p>
        </div>
        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 32px; border-top: 1px solid rgba(165, 236, 235, 0.1); pt-4;">
          This is an automated notification from Asclepia Healthcare Systems. If you did not initiate this request, please contact security immediately.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Welcome to Asclepia - Account Activated',
    text: `Hello ${userName},\nYour account (${userEmail}) for Asclepia Portal has been activated.`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
};
