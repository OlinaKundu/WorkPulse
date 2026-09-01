const prisma = require('../config/prisma');
const attendanceRepository = require('../repositories/AttendanceRepository');
const userRepository = require('../repositories/UserRepository');
const breakRepository = require('../repositories/BreakRepository');
const auditRepository = require('../repositories/AuditRepository');
const settingsRepository = require('../repositories/SettingsRepository');
const emailService = require('./EmailService');
const { calculateHaversineDistance } = require('../utils/haversine');
const {
  isCheckInLate,
  calculateNetWorkingHours,
  determineAttendanceStatusAndLeave,
} = require('../utils/calculations');
const { AUDIT_ACTIONS } = require('../config/constants');

class AttendanceService {
  /**
   * Formats a date object to YYYY-MM-DD local string
   */
  getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Process employee check-in with Geofencing verification
   */
  async checkIn(userId, { latitude, longitude } = {}) {
    const today = this.getLocalDateString();
    const existing = await attendanceRepository.findByUserAndDate(userId, today);

    if (existing) {
      const err = new Error('You have already logged a check-in for today (' + today + '). Multiple check-ins on the same day are restricted.');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    const isLate = isCheckInLate(now);

    // Fetch active dynamic office location settings
    const officeSettings = await settingsRepository.getOfficeSettings();

    let distanceMeters = null;
    let isOutOfBounds = false;

    if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      distanceMeters = calculateHaversineDistance(
        lat,
        lon,
        officeSettings.latitude,
        officeSettings.longitude
      );
      if (distanceMeters !== null && distanceMeters > officeSettings.radiusMeters) {
        isOutOfBounds = true;
      }
    }

    const initialStatus = isLate ? 'Late' : 'Present';

    const record = await attendanceRepository.createCheckIn({
      userId,
      attendanceDate: today,
      checkIn: now,
      status: initialStatus,
      isOutOfBounds,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      distanceMeters,
    });

    return {
      message: isOutOfBounds
        ? `Check-in recorded successfully as Remote / Out of Bounds (${Math.round(distanceMeters || 0)}m from office).`
        : `Check-in recorded successfully ${isLate ? '(Late Arrival: after 09:30 AM)' : '(On Time)'}.`,
      attendance: record,
    };
  }

  /**
   * Process employee check-out with net hours & financial-grade leave deduction calculations
   */
  async checkOut(userId) {
    const today = this.getLocalDateString();
    const attendance = await attendanceRepository.findActiveCheckIn(userId, today);

    if (!attendance) {
      const existingToday = await attendanceRepository.findByUserAndDate(userId, today);
      if (existingToday && existingToday.checkOut) {
        const err = new Error('You have already checked out for today.');
        err.statusCode = 400;
        throw err;
      }
      const err = new Error('No active check-in record found for today. Please check in first.');
      err.statusCode = 400;
      throw err;
    }

    const checkOutTime = new Date();

    // Check if an active break is running; if so, close it
    const activeBreak = await breakRepository.findActiveBreak(attendance.id);
    if (activeBreak) {
      const breakMinutes = Math.max(
        0,
        (checkOutTime.getTime() - new Date(activeBreak.breakStart).getTime()) / (1000 * 60)
      );
      await breakRepository.endBreak(activeBreak.id, Math.round(breakMinutes * 100) / 100);
    }

    // Refresh breaks list for calculation
    const allBreaks = await breakRepository.findBreaksByAttendance(attendance.id);

    // Calculate net working hours
    const netWorkingHours = calculateNetWorkingHours(
      attendance.checkIn,
      checkOutTime,
      allBreaks
    );

    // Determine status and leave deduction
    const wasLate = isCheckInLate(attendance.checkIn);
    const { status, leaveDeducted } = determineAttendanceStatusAndLeave(netWorkingHours, wasLate);

    // Perform ACID Transaction to update attendance and deduct leave balance if applicable
    const result = await prisma.$transaction(async (tx) => {
      const updatedAttendance = await attendanceRepository.updateCheckOut(
        attendance.id,
        {
          checkOut: checkOutTime,
          workingHours: netWorkingHours,
          status,
          leaveDeducted,
        },
        tx
      );

      if (leaveDeducted > 0) {
        await userRepository.deductLeaveBalance(userId, leaveDeducted, tx);
      }

      return updatedAttendance;
    });

    return {
      message: `Shift completed. Total net hours worked: ${netWorkingHours.toFixed(2)}h. Status: ${status}${
        leaveDeducted > 0 ? ` (${leaveDeducted} day leave balance deducted).` : '.'
      }`,
      attendance: result,
    };
  }

  /**
   * Retrieve today's attendance status & active break details for a user
   */
  async getTodayStatus(userId) {
    const today = this.getLocalDateString();
    const attendance = await attendanceRepository.findByUserAndDate(userId, today);
    const activeBreak = attendance ? await breakRepository.findActiveBreak(attendance.id) : null;

    return {
      today,
      attendance,
      isCheckedIn: !!attendance && !!attendance.checkIn,
      isCheckedOut: !!attendance && !!attendance.checkOut,
      hasActiveBreak: !!activeBreak,
      activeBreak,
    };
  }

  /**
   * Get historical attendance records for an employee
   */
  async getUserHistory(userId, filters) {
    return attendanceRepository.findUserHistory(userId, filters);
  }

  /**
   * Get workforce attendance records (HR View)
   */
  async getWorkforceAttendance(filters) {
    return attendanceRepository.findWorkforceAttendance(filters);
  }

  /**
   * Get HR Dashboard workforce statistics
   */
  async getWorkforceStats(dateStr) {
    const queryDate = dateStr || this.getLocalDateString();
    return attendanceRepository.getRecentWorkforceStats(queryDate);
  }

  /**
   * HR Admin manual override of attendance record with Immutable Audit Logging & Email Notification
   */
  async overrideAttendance(hrUserId, attendanceId, updates, reason = '') {
    const record = await attendanceRepository.findById(attendanceId);
    if (!record) {
      const err = new Error('Attendance record not found');
      err.statusCode = 404;
      throw err;
    }

    const hrAdmin = await userRepository.findById(hrUserId);

    const oldValueSnapshot = {
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      workingHours: record.workingHours,
      status: record.status,
      leaveDeducted: record.leaveDeducted,
    };

    const newCheckIn = updates.checkIn !== undefined ? (updates.checkIn ? new Date(updates.checkIn) : null) : record.checkIn;
    const newCheckOut = updates.checkOut !== undefined ? (updates.checkOut ? new Date(updates.checkOut) : null) : record.checkOut;
    let newWorkingHours = updates.workingHours !== undefined ? parseFloat(updates.workingHours) : record.workingHours;

    if (updates.checkIn !== undefined || updates.checkOut !== undefined) {
      if (newCheckIn && newCheckOut) {
        newWorkingHours = calculateNetWorkingHours(newCheckIn, newCheckOut, record.breaks || []);
      }
    }

    const newStatus = updates.status || record.status;
    const newLeaveDeducted = updates.leaveDeducted !== undefined ? parseFloat(updates.leaveDeducted) : record.leaveDeducted;

    const newValueSnapshot = {
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      workingHours: newWorkingHours,
      status: newStatus,
      leaveDeducted: newLeaveDeducted,
      reason: reason || 'Manual HR adjustment',
    };

    // Calculate leave balance adjustment difference
    const leaveDiff = newLeaveDeducted - record.leaveDeducted;

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update attendance record
      const att = await attendanceRepository.updateRecord(
        attendanceId,
        {
          checkIn: newCheckIn,
          checkOut: newCheckOut,
          workingHours: newWorkingHours,
          status: newStatus,
          leaveDeducted: newLeaveDeducted,
        },
        tx
      );

      // 2. Adjust target user leave balance if leave deducted changed
      if (leaveDiff !== 0) {
        await userRepository.deductLeaveBalance(record.userId, leaveDiff, tx);
      }

      // 3. Write immutable audit log
      await auditRepository.createLog(
        {
          performedBy: hrUserId,
          targetAttendanceId: attendanceId,
          targetUserId: record.userId,
          action: AUDIT_ACTIONS.ATTENDANCE_OVERRIDE,
          oldValue: oldValueSnapshot,
          newValue: newValueSnapshot,
        },
        tx
      );

      return att;
    });

    // 4. Trigger automated email notification to employee
    if (record.user && record.user.email) {
      emailService.sendAttendanceOverrideNotification({
        employeeEmail: record.user.email,
        employeeName: record.user.fullName,
        attendanceDate: record.attendanceDate,
        updatedFields: {
          'Check-In': newCheckIn ? new Date(newCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'None',
          'Check-Out': newCheckOut ? new Date(newCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'None',
          'Net Hours Worked': `${parseFloat(newWorkingHours).toFixed(2)}h`,
          'Status': newStatus,
          'Leave Deducted': `${newLeaveDeducted} Days`,
        },
        reason: reason || 'Administrative record correction',
        adminName: hrAdmin ? hrAdmin.fullName : 'HR Administrator',
      }).catch((e) => console.error('Email dispatch error:', e.message));
    }

    return updated;
  }

  /**
   * HR Admin manual override of employee leave balance with Immutable Audit Logging & Email Notification
   */
  async overrideLeaveBalance(hrUserId, targetUserId, newBalance, reason = '') {
    const user = await userRepository.findById(targetUserId);
    if (!user) {
      const err = new Error('Target user not found');
      err.statusCode = 404;
      throw err;
    }

    const hrAdmin = await userRepository.findById(hrUserId);
    const oldBalance = user.leaveBalance;
    const numericNewBalance = parseFloat(newBalance);

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await userRepository.updateLeaveBalance(targetUserId, numericNewBalance, tx);

      await auditRepository.createLog(
        {
          performedBy: hrUserId,
          targetUserId,
          action: AUDIT_ACTIONS.LEAVE_BALANCE_OVERRIDE,
          oldValue: { leaveBalance: oldBalance },
          newValue: { leaveBalance: numericNewBalance, reason: reason || 'Manual HR Leave Balance Adjustment' },
        },
        tx
      );

      return updatedUser;
    });

    // Trigger automated email notification to employee
    emailService.sendLeaveBalanceAdjustmentNotification({
      employeeEmail: user.email,
      employeeName: user.fullName,
      oldBalance,
      newBalance: numericNewBalance,
      reason: reason || 'Manual HR adjustment',
      adminName: hrAdmin ? hrAdmin.fullName : 'HR Administrator',
    }).catch((e) => console.error('Email dispatch error:', e.message));

    return result;
  }

  /**
   * HR Admin deletion of an employee account with Immutable Audit Logging & Email Notification
   */
  async deleteUserAccount(hrUserId, targetUserId, reason = '') {
    if (hrUserId === targetUserId) {
      const err = new Error('You cannot delete your own administrative account.');
      err.statusCode = 400;
      throw err;
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    const hrAdmin = await userRepository.findById(hrUserId);

    await prisma.$transaction(async (tx) => {
      // 1. Log immutable audit entry
      await auditRepository.createLog(
        {
          performedBy: hrUserId,
          targetUserId: null, // Set null so deletion doesn't violate FK if setNull
          action: 'USER_ACCOUNT_DELETED',
          oldValue: {
            id: targetUser.id,
            fullName: targetUser.fullName,
            email: targetUser.email,
            role: targetUser.role,
            department: targetUser.department?.name,
          },
          newValue: {
            deletedAt: new Date().toISOString(),
            reason: reason || 'Administrative employee account termination',
          },
        },
        tx
      );

      // 2. Cascade delete attendances & user
      await tx.attendance.deleteMany({
        where: { userId: targetUserId },
      });

      await userRepository.deleteUser(targetUserId, tx);
    });

    // Trigger termination notice email to employee
    emailService.sendAccountDeletionNotification({
      employeeEmail: targetUser.email,
      employeeName: targetUser.fullName,
      reason: reason || 'Administrative account termination',
      adminName: hrAdmin ? hrAdmin.fullName : 'HR Administrator',
    }).catch((e) => console.error('Email dispatch error:', e.message));

    return {
      message: `Account for ${targetUser.fullName} (${targetUser.email}) was permanently removed and notification email was dispatched.`,
    };
  }
}

module.exports = new AttendanceService();
