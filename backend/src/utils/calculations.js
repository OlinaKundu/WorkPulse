const {
  STANDARD_SHIFT_START_HOUR,
  STANDARD_SHIFT_START_MINUTE,
  FULL_DAY_MIN_HOURS,
  HALF_DAY_MIN_HOURS,
  STATUS,
} = require('../config/constants');

/**
 * Checks if a check-in timestamp is past the standard shift start time (09:30 AM)
 * @param {Date|string} checkInTime
 * @returns {boolean}
 */
function isCheckInLate(checkInTime) {
  if (!checkInTime) return false;
  const date = new Date(checkInTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  if (hours > STANDARD_SHIFT_START_HOUR) {
    return true;
  }
  if (hours === STANDARD_SHIFT_START_HOUR && minutes > STANDARD_SHIFT_START_MINUTE) {
    return true;
  }
  return false;
}

/**
 * Calculates net working hours deducting any completed break intervals
 * Hours Worked = (CheckOut Time - CheckIn Time) / 3600 seconds - Total Break Hours
 *
 * @param {Date|string} checkIn
 * @param {Date|string} checkOut
 * @param {Array} breaks Array of break objects { breakStart, breakEnd, durationMinutes }
 * @returns {number} Net working hours rounded to 2 decimal places
 */
function calculateNetWorkingHours(checkIn, checkOut, breaks = []) {
  if (!checkIn || !checkOut) return 0.0;

  const startMs = new Date(checkIn).getTime();
  const endMs = new Date(checkOut).getTime();

  if (endMs <= startMs) return 0.0;

  const grossSeconds = (endMs - startMs) / 1000;
  const grossHours = grossSeconds / 3600;

  // Calculate cumulative break hours
  let totalBreakMinutes = 0;
  for (const b of breaks) {
    if (b.durationMinutes && b.durationMinutes > 0) {
      totalBreakMinutes += b.durationMinutes;
    } else if (b.breakStart && b.breakEnd) {
      const bStart = new Date(b.breakStart).getTime();
      const bEnd = new Date(b.breakEnd).getTime();
      if (bEnd > bStart) {
        totalBreakMinutes += (bEnd - bStart) / (1000 * 60);
      }
    }
  }

  const breakHours = totalBreakMinutes / 60;
  const netHours = Math.max(0, grossHours - breakHours);

  return Math.round(netHours * 100) / 100;
}

/**
 * Determines attendance status and leave deduction based on shift hours worked & lateness
 * - Hours Worked < 4.0 hours = Marked 'Absent' with 1.0 day leave balance deduction.
 * - 4.0 <= Hours Worked < 8.0 hours = Marked 'Half Day' with 0.5 day leave balance deduction.
 * - Hours Worked >= 8.0 hours = Marked 'Present' (or 'Late' if checked in after 09:30 AM) with 0 deduction.
 *
 * @param {number} workingHours
 * @param {boolean} isLate
 * @returns {{ status: string, leaveDeducted: number }}
 */
function determineAttendanceStatusAndLeave(workingHours, isLate = false) {
  if (workingHours < HALF_DAY_MIN_HOURS) {
    return {
      status: STATUS.ABSENT,
      leaveDeducted: 1.0,
    };
  }

  if (workingHours < FULL_DAY_MIN_HOURS) {
    return {
      status: STATUS.HALF_DAY,
      leaveDeducted: 0.5,
    };
  }

  return {
    status: isLate ? STATUS.LATE : STATUS.PRESENT,
    leaveDeducted: 0.0,
  };
}

module.exports = {
  isCheckInLate,
  calculateNetWorkingHours,
  determineAttendanceStatusAndLeave,
};
