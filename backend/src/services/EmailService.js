const nodemailer = require('nodemailer');
const settingsRepository = require('../repositories/SettingsRepository');

class EmailService {
  constructor() {
    this.transporter = null;
    this.cachedConfig = null;
    this.recentDispatches = [];
  }

  async getTransporter() {
    const emailSettings = await settingsRepository.getEmailSettings();
    const configKey = `${emailSettings.smtpHost}:${emailSettings.smtpPort}:${emailSettings.smtpUser}:${emailSettings.smtpPass}`;

    if (this.transporter && this.cachedConfig === configKey) {
      return { transporter: this.transporter, settings: emailSettings };
    }

    if (emailSettings.smtpUser && emailSettings.smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: emailSettings.smtpHost || 'smtp.gmail.com',
        port: emailSettings.smtpPort || 587,
        secure: emailSettings.smtpPort === 465,
        auth: {
          user: emailSettings.smtpUser,
          pass: emailSettings.smtpPass,
        },
      });
      this.cachedConfig = configKey;
      console.log(`📧 EmailService: Configured with live SMTP server [${emailSettings.smtpHost}] for user [${emailSettings.smtpUser}]`);
      return { transporter: this.transporter, settings: emailSettings };
    }

    // Fallback Ethereal test account if no custom credentials
    if (!this.transporter) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.cachedConfig = 'ethereal';
        console.log('📧 EmailService: Initialized Ethereal test preview transporter.');
      } catch (e) {
        console.log('📧 EmailService: Running in local console log fallback.');
      }
    }

    return { transporter: this.transporter, settings: emailSettings };
  }

  async sendMail({ to, subject, html, text }) {
    const { transporter, settings } = await this.getTransporter();
    const senderName = settings.senderName || 'WorkPulse HR System';
    const senderAddress = settings.smtpUser || 'notifications@workpulse.io';
    const from = `"${senderName}" <${senderAddress}>`;

    let previewUrl = null;
    let messageId = null;

    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });

        messageId = info.messageId;
        previewUrl = nodemailer.getTestMessageUrl(info);

        console.log('\n=================== 📨 OUTGOING EMAIL DISPATCHED ===================');
        console.log(`TO: ${to}`);
        console.log(`FROM: ${from}`);
        console.log(`SUBJECT: ${subject}`);
        if (previewUrl) {
          console.log(`🌐 LIVE PREVIEW: ${previewUrl}`);
        }
        console.log('---------------------------- TEXT PREVIEW ----------------------------');
        console.log(text);
        console.log('====================================================================\n');

        const dispatchRecord = {
          to,
          subject,
          messageId,
          previewUrl,
          dispatchedAt: new Date().toISOString(),
        };
        this.recentDispatches.unshift(dispatchRecord);
        if (this.recentDispatches.length > 50) this.recentDispatches.pop();

        return { success: true, messageId, previewUrl };
      } catch (err) {
        console.error(`❌ Failed to dispatch email to ${to}:`, err.message);
        throw err;
      }
    }

    // Fallback console logging
    console.log('\n=================== 📨 OUTGOING EMAIL (FALLBACK) ===================');
    console.log(`TO: ${to}`);
    console.log(`FROM: ${from}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(text);
    console.log('====================================================================\n');

    return { success: true, simulated: true };
  }

  /**
   * Send test email to verify credentials
   */
  async sendTestEmail(targetEmail) {
    const subject = `[WorkPulse] Test Email Notification`;
    const text = `This is a test email from WorkPulse HR Enterprise Attendance System.\nYour email notifications are configured and functioning correctly!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 18px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 18px;">WorkPulse Email Service Active</h2>
        </div>
        <div style="padding: 20px; color: #1e293b; line-height: 1.5; text-align: center;">
          <p style="font-size: 14px;"><strong>Success!</strong> Your company SMTP email service is configured and connected.</p>
          <p style="font-size: 12px; color: #64748b;">
            Employees will now automatically receive notices when attendance, leave balances, or accounts are adjusted.
          </p>
        </div>
      </div>
    `;

    return this.sendMail({ to: targetEmail, subject, text, html });
  }

  /**
   * 1. Attendance Record Override Notification
   */
  async sendAttendanceOverrideNotification({
    employeeEmail,
    employeeName,
    attendanceDate,
    updatedFields,
    reason,
    adminName,
  }) {
    if (!employeeEmail) return;

    const subject = `[WorkPulse] Attendance Record Modified for ${attendanceDate}`;
    const formattedFields = Object.entries(updatedFields)
      .map(([k, v]) => `• ${k}: ${v}`)
      .join('\n');

    const text = `Hello ${employeeName},\n\n` +
      `Your attendance record for date ${attendanceDate} has been updated by HR Administrator (${adminName || 'HR Management'}).\n\n` +
      `Updated Details:\n${formattedFields}\n\n` +
      `Reason for Adjustment: ${reason || 'Administrative correction'}\n\n` +
      `If you have any questions regarding this change, please contact your HR department.\n\n` +
      `Best regards,\nWorkPulse Enterprise HR`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px;">WorkPulse HR Notification</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Attendance Record Modification Notice</p>
        </div>
        <div style="padding: 24px; color: #1e293b; line-height: 1.5;">
          <p>Hello <strong>${employeeName}</strong>,</p>
          <p>This is an automated notification that your shift attendance record for <strong>${attendanceDate}</strong> has been updated by <strong>${adminName || 'HR Administrator'}</strong>.</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 14px; margin: 16px 0; border-radius: 4px;">
            <h4 style="margin: 0 0 8px 0; color: #334155; font-size: 14px;">Modified Fields:</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
              ${Object.entries(updatedFields)
                .map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`)
                .join('')}
            </ul>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            <strong>Administrative Reason:</strong> ${reason || 'Administrative adjustment'}
          </p>

          <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            You can review your updated shift logs at any time on your <a href="http://localhost:3000" style="color: #4f46e5;">WorkPulse Employee Console</a>.
          </p>
        </div>
      </div>
    `;

    return this.sendMail({ to: employeeEmail, subject, text, html });
  }

  /**
   * 2. Leave Balance Adjustment Notification
   */
  async sendLeaveBalanceAdjustmentNotification({
    employeeEmail,
    employeeName,
    oldBalance,
    newBalance,
    reason,
    adminName,
  }) {
    if (!employeeEmail) return;

    const subject = `[WorkPulse] Notice of Leave Balance Adjustment`;
    const diff = Number(newBalance) - Number(oldBalance);
    const diffText = diff > 0 ? `+${diff.toFixed(1)} Days` : `${diff.toFixed(1)} Days`;

    const text = `Hello ${employeeName},\n\n` +
      `Your annual leave balance has been adjusted by HR Administrator (${adminName || 'HR Management'}).\n\n` +
      `Previous Balance: ${oldBalance} Days\n` +
      `New Balance: ${newBalance} Days (${diffText})\n` +
      `Reason: ${reason || 'Manual administrative balance adjustment'}\n\n` +
      `Best regards,\nWorkPulse Enterprise HR`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #059669; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px;">WorkPulse Leave Balance Update</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Official Balance Adjustment Notice</p>
        </div>
        <div style="padding: 24px; color: #1e293b; line-height: 1.5;">
          <p>Hello <strong>${employeeName}</strong>,</p>
          <p>Your paid leave balance has been updated by <strong>${adminName || 'HR Management'}</strong>.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #64748b;">Previous Balance:</td>
              <td style="padding: 10px; color: #334155;">${oldBalance} Days</td>
            </tr>
            <tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-weight: bold; color: #64748b;">New Leave Balance:</td>
              <td style="padding: 10px; font-weight: bold; color: #059669; font-size: 15px;">${newBalance} Days (${diffText})</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px; font-weight: bold; color: #64748b;">Reason:</td>
              <td style="padding: 10px; color: #334155;">${reason || 'Manual HR adjustment'}</td>
            </tr>
          </table>

          <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            Log into <a href="http://localhost:3000" style="color: #059669;">WorkPulse</a> to view your updated leave ledger.
          </p>
        </div>
      </div>
    `;

    return this.sendMail({ to: employeeEmail, subject, text, html });
  }

  /**
   * 3. Account Deletion Notification
   */
  async sendAccountDeletionNotification({
    employeeEmail,
    employeeName,
    reason,
    adminName,
  }) {
    if (!employeeEmail) return;

    const subject = `[WorkPulse] Notice of Account Termination`;
    const text = `Hello ${employeeName},\n\n` +
      `This notification confirms that your employee account on WorkPulse has been terminated by HR Administrator (${adminName || 'HR Management'}).\n\n` +
      `Reason: ${reason || 'Administrative termination'}\n\n` +
      `Effective Date: ${new Date().toLocaleDateString()}\n\n` +
      `If you believe this was done in error, please reach out to your organization administrator immediately.\n\n` +
      `Best regards,\nWorkPulse Enterprise HR`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #e11d48; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px;">WorkPulse Account Notice</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Account Termination Confirmation</p>
        </div>
        <div style="padding: 24px; color: #1e293b; line-height: 1.5;">
          <p>Hello <strong>${employeeName}</strong>,</p>
          <p>This email confirms that your employee account on WorkPulse has been permanently terminated by <strong>${adminName || 'HR Administrator'}</strong>.</p>
          
          <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 14px; border-radius: 6px; margin: 16px 0; font-size: 13px; color: #9f1239;">
            <p style="margin: 0;"><strong>Termination Reason:</strong> ${reason || 'Administrative account deletion'}</p>
            <p style="margin: 6px 0 0 0;"><strong>Effective Date:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
          </div>

          <p style="font-size: 12px; color: #64748b;">
            If you have questions regarding final settlements or certificates, please contact HR.
          </p>
        </div>
      </div>
    `;

    return this.sendMail({ to: employeeEmail, subject, text, html });
  }
}

module.exports = new EmailService();
