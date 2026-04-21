import { sendPlainEmailSchema } from "@zerocancer/shared";
import { z } from "zod";

// Email service that works in both Cloudflare Workers and Node.js (Vercel)
let WorkerMailer: any;

try {
  // Try to import worker-mailer (works in Cloudflare Workers)
  const workerMailerModule = await import("worker-mailer");
  WorkerMailer = workerMailerModule.WorkerMailer;
} catch (error) {
  // Fallback for Node.js environment (Vercel)
  console.log("📧 Running in Node.js mode - using nodemailer fallback");
  
  // Dynamic import of nodemailer for Node.js environments
  try {
    const nodemailer = await import("nodemailer");
    WorkerMailer = {
      connect: async (config: any) => {
        const transporter = nodemailer.default.createTransporter({
          host: config.host,
          port: config.port,
          secure: config.secure || false,
          auth: {
            user: config.credentials.username,
            pass: config.credentials.password,
          },
        });
        
        return {
          send: async (options: any) => {
            try {
              const result = await transporter.sendMail(options);
              return { success: true, messageId: result.messageId };
            } catch (error) {
              console.error("Email send error:", error);
              return { success: false, error };
            }
          },
        };
      },
    };
  } catch (nodemailerError) {
    // Final fallback - mock email service
    console.log("📧 Nodemailer not available - using mock email service");
    WorkerMailer = {
      connect: async () => ({
        send: async (options: any) => {
          console.log("📧 [MOCK EMAIL]", {
            to: options.to,
            subject: options.subject,
            from: options.from,
          });
          return { success: true, messageId: "mock-" + Date.now() };
        },
      }),
    };
  }
}

export async function sendEmail(
  c: any,
  { to, subject, html, text }: z.infer<typeof sendPlainEmailSchema>
) {
  // Convert array to comma-separated string if needed
  const toAddress = Array.isArray(to) ? to.join(", ") : to;

  // Get environment variables from either Hono context or process.env (for Vercel)
  const smtpConfig = {
    host: c.env?.SMTP_HOST || process.env.SMTP_HOST,
    port: Number(c.env?.SMTP_PORT || process.env.SMTP_PORT || 587),
    secure: (c.env?.SMTP_SECURE || process.env.SMTP_SECURE) === "true",
    credentials: {
      username: c.env?.SMTP_USER || process.env.SMTP_USER,
      password: c.env?.SMTP_PASS || process.env.SMTP_PASS,
    },
  };

  const transporter = await WorkerMailer.connect(smtpConfig);

  return transporter.send({
    from: smtpConfig.credentials.username,
    to: toAddress!,
    subject: subject!,
    html,
    text,
  });
}

/**
 * Creates an HTML email template for different notification types
 */
export function createEmailTemplate(c: any, {
  type,
  title,
  message,
  data,
}: {
  type: string;
  title: string;
  message: string;
  data?: any;
}) {
  const baseStyles = `
    <style>
      .email-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
      .footer { background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
      .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      .alert { padding: 15px; border-radius: 6px; margin: 15px 0; }
      .alert-success { background-color: #d1fae5; border: 1px solid #10b981; color: #065f46; }
      .alert-info { background-color: #dbeafe; border: 1px solid #3b82f6; color: #1e40af; }
    </style>
  `;

  let actionButton = "";
  let alertClass = "alert-info";

  // Customize template based on notification type
  switch (type) {
    case "MATCHED":
      alertClass = "alert-success";
      actionButton = `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${c.env.FRONTEND_URL}/patient/appointments" class="button">
            View Your Appointments
          </a>
        </div>
      `;
      break;
    case "PATIENT_MATCHED":
      alertClass = "alert-success";
      actionButton = `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${c.env.FRONTEND_URL}/donor/campaigns" class="button">
            View Your Campaign
          </a>
        </div>
      `;
      break;
    case "APPOINTMENT_REMINDER":
      actionButton = `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${c.env.FRONTEND_URL}/patient/appointments" class="button">
            View Appointment Details
          </a>
        </div>
      `;
      break;
    case "RESULT_READY":
      actionButton = `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${c.env.FRONTEND_URL}/patient/results" class="button">
            View Your Results
          </a>
        </div>
      `;
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${baseStyles}
    </head>
    <body style="background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div class="email-container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">ZeroCancer</h1>
        </div>
        <div class="content">
          <div class="alert ${alertClass}">
            <h2 style="margin: 0 0 10px 0; font-size: 18px;">${title}</h2>
          </div>
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin: 20px 0;">
            ${message}
          </p>
          ${actionButton}
        </div>
        <div class="footer">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            This is an automated notification from ZeroCancer.<br>
            If you have any questions, please contact our support team.
          </p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
            © ${new Date().getFullYear()} ZeroCancer. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send notification email with improved template
 */
export async function sendNotificationEmail(
  c: any,
  {
    to,
    type,
    title,
    message,
    data,
  }: {
    to: string | string[];
    type: string;
    title: string;
    message: string;
    data?: any;
  }
) {
  const htmlContent = createEmailTemplate(c, { type, title, message, data });

  return sendEmail(c, {
    to,
    subject: `ZeroCancer - ${title}`,
    text: message,
    html: htmlContent,
  });
}
