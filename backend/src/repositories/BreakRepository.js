const prisma = require('../config/prisma');

class BreakRepository {
  async findActiveBreak(attendanceId) {
    return prisma.break.findFirst({
      where: {
        attendanceId,
        breakEnd: null,
      },
    });
  }

  async startBreak(attendanceId, breakType = 'Lunch') {
    return prisma.break.create({
      data: {
        attendanceId,
        breakType,
        breakStart: new Date(),
      },
    });
  }

  async endBreak(breakId, durationMinutes) {
    return prisma.break.update({
      where: { id: breakId },
      data: {
        breakEnd: new Date(),
        durationMinutes: parseFloat(durationMinutes),
      },
    });
  }

  async findBreaksByAttendance(attendanceId) {
    return prisma.break.findMany({
      where: { attendanceId },
      orderBy: { breakStart: 'asc' },
    });
  }
}

module.exports = new BreakRepository();
