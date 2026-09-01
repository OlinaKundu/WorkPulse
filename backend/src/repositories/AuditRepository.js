const prisma = require('../config/prisma');

class AuditRepository {
  async createLog({ performedBy, targetAttendanceId, targetUserId, action, oldValue, newValue }, tx = prisma) {
    return tx.auditLog.create({
      data: {
        performedBy,
        targetAttendanceId: targetAttendanceId || null,
        targetUserId: targetUserId || null,
        action,
        oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue,
        newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : newValue,
      },
      include: {
        performer: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        targetUser: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  async findAllLogs({ limit = 100, page = 1 } = {}) {
    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        include: {
          performer: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          targetUser: {
            select: { id: true, fullName: true, email: true },
          },
          targetAttendance: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { total, logs, page, limit };
  }

  async findLogsByAttendanceId(attendanceId) {
    return prisma.auditLog.findMany({
      where: { targetAttendanceId: attendanceId },
      include: {
        performer: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

module.exports = new AuditRepository();
