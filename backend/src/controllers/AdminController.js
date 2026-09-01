const attendanceService = require('../services/AttendanceService');
const settingsRepository = require('../repositories/SettingsRepository');

class AdminController {
  async getWorkforceAttendance(req, res, next) {
    try {
      const { date, startDate, endDate, departmentId, status, search } = req.query;
      const records = await attendanceService.getWorkforceAttendance({
        date,
        startDate,
        endDate,
        departmentId,
        status,
        search,
      });

      return res.status(200).json({
        success: true,
        count: records.length,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const { date } = req.query;
      const stats = await attendanceService.getWorkforceStats(date);
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOfficeSettings(req, res, next) {
    try {
      const settings = await settingsRepository.getOfficeSettings();
      return res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOfficeSettings(req, res, next) {
    try {
      const { address, latitude, longitude, radiusMeters } = req.body;
      const updated = await settingsRepository.updateOfficeSettings({
        address,
        latitude,
        longitude,
        radiusMeters,
      });
      return res.status(200).json({
        success: true,
        message: 'Office location & geofence parameters updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async overrideAttendance(req, res, next) {
    try {
      const { id } = req.params;
      const { checkIn, checkOut, workingHours, status, leaveDeducted, reason } = req.body;

      const updated = await attendanceService.overrideAttendance(
        req.user.id,
        id,
        { checkIn, checkOut, workingHours, status, leaveDeducted },
        reason
      );

      return res.status(200).json({
        success: true,
        message: 'Attendance record updated successfully with immutable audit log recorded.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async overrideLeaveBalance(req, res, next) {
    try {
      const { userId } = req.params;
      const { leaveBalance, reason } = req.body;

      if (leaveBalance === undefined || leaveBalance === null) {
        return res.status(400).json({
          success: false,
          message: 'leaveBalance value is required',
        });
      }

      const updated = await attendanceService.overrideLeaveBalance(
        req.user.id,
        userId,
        leaveBalance,
        reason
      );

      return res.status(200).json({
        success: true,
        message: 'Employee leave balance overridden successfully with immutable audit log recorded.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { reason } = req.body || {};

      const result = await attendanceService.deleteUserAccount(
        req.user.id,
        userId,
        reason
      );

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmailSettings(req, res, next) {
    try {
      const settings = await settingsRepository.getEmailSettings();
      // Mask password for security
      const maskedPass = settings.smtpPass ? '••••••••••••••••' : '';
      return res.status(200).json({
        success: true,
        data: {
          ...settings,
          smtpPass: maskedPass,
          hasPassword: !!settings.smtpPass,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEmailSettings(req, res, next) {
    try {
      const { smtpUser, smtpPass, smtpHost, smtpPort, senderName } = req.body;
      const updatePayload = {
        smtpUser,
        smtpHost,
        smtpPort,
        senderName,
      };
      // Only update password if non-empty and not masked
      if (smtpPass && !smtpPass.includes('••••')) {
        updatePayload.smtpPass = smtpPass;
      }

      const updated = await settingsRepository.updateEmailSettings(updatePayload);
      return res.status(200).json({
        success: true,
        message: 'Company Email & SMTP notification settings saved successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async testEmailNotification(req, res, next) {
    try {
      const { targetEmail } = req.body;
      const emailService = require('../services/EmailService');
      const recipient = targetEmail || req.user.email;

      const result = await emailService.sendTestEmail(recipient);
      return res.status(200).json({
        success: true,
        message: `Test email dispatched to ${recipient}!`,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
