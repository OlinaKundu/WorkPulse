const attendanceRepository = require('../repositories/AttendanceRepository');
const breakRepository = require('../repositories/BreakRepository');

class BreakService {
  getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async startBreak(userId, breakType = 'Lunch') {
    const today = this.getLocalDateString();
    const attendance = await attendanceRepository.findActiveCheckIn(userId, today);

    if (!attendance) {
      const err = new Error('Cannot start a break without an active shift check-in for today.');
      err.statusCode = 400;
      throw err;
    }

    const activeBreak = await breakRepository.findActiveBreak(attendance.id);
    if (activeBreak) {
      const err = new Error(`A ${activeBreak.breakType} is already in progress. Please end it before starting a new break.`);
      err.statusCode = 400;
      throw err;
    }

    const createdBreak = await breakRepository.startBreak(attendance.id, breakType);
    return {
      message: `${breakType} break started at ${new Date(createdBreak.breakStart).toLocaleTimeString()}.`,
      break: createdBreak,
    };
  }

  async endBreak(userId) {
    const today = this.getLocalDateString();
    const attendance = await attendanceRepository.findByUserAndDate(userId, today);

    if (!attendance) {
      const err = new Error('No attendance record found for today.');
      err.statusCode = 400;
      throw err;
    }

    const activeBreak = await breakRepository.findActiveBreak(attendance.id);
    if (!activeBreak) {
      const err = new Error('No active break found to end.');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    const durationMinutes = Math.max(
      0.1,
      (now.getTime() - new Date(activeBreak.breakStart).getTime()) / (1000 * 60)
    );
    const roundedMinutes = Math.round(durationMinutes * 100) / 100;

    const completedBreak = await breakRepository.endBreak(activeBreak.id, roundedMinutes);

    return {
      message: `${completedBreak.breakType} break ended. Total duration: ${roundedMinutes} minutes.`,
      break: completedBreak,
    };
  }

  async getActiveBreak(userId) {
    const today = this.getLocalDateString();
    const attendance = await attendanceRepository.findByUserAndDate(userId, today);
    if (!attendance) return null;

    return breakRepository.findActiveBreak(attendance.id);
  }
}

module.exports = new BreakService();
