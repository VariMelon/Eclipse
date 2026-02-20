import nodemailer from "nodemailer";

type EmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || "smtp.zoho.com";
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be set");
  }

  return { host, port, secure, user, pass };
}

function getFromAddress() {
  const fromName = process.env.SMTP_FROM_NAME || "Eclipse";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "";
  if (!fromEmail) {
    throw new Error("SMTP_FROM_EMAIL or SMTP_USER must be set");
  }

  return `${fromName} <${fromEmail}>`;
}

async function sendEmail(options: EmailOptions) {
  const smtp = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  await transporter.sendMail({
    from: getFromAddress(),
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

export async function sendVerificationEmail(to: string, verificationUrl: string) {
  const subject = "Verify your Eclipse account";
  const text = `Welcome to Eclipse!\n\nVerify your email by visiting this link:\n${verificationUrl}\n\nThis link expires in 48 hours.`;
  const html = `
    <p>Welcome to Eclipse!</p>
    <p>Verify your email by clicking the link below:</p>
    <p><a href="${verificationUrl}">Verify your email</a></p>
    <p>This link expires in 48 hours.</p>
  `;

  await sendEmail({ to, subject, text, html });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const subject = "Reset your Eclipse password";
  const text = `You requested a password reset.\n\nReset your password here:\n${resetUrl}\n\nThis link expires in 24 hours.`;
  const html = `
    <p>You requested a password reset.</p>
    <p>Reset your password by clicking the link below:</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>This link expires in 24 hours.</p>
  `;

  await sendEmail({ to, subject, text, html });
}
