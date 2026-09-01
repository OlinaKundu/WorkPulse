const prisma = require('../config/prisma');

class AttendanceRepository {
  async findByUserAndDate(userId, attendanceDate) {
    return prisma.attendance.findUnique({
      where: {
        unique_user_daily_attendance: {
          userId,
          attendanceDate,
        },
      },
      include: {
        breaks: true,
        user: {
          include: { department: true },
        },
      },
    });
  }

  async findById(id) {
    return prisma.attendance.findUnique({
      where: { id },
      include: {
        breaks: true,
        user: {
          include: { department: true },
        },
        auditLogs: {
          include: { performer: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findActiveCheckIn(userId, attendanceDate) {
    return prisma.attendance.findFirst({
      where: {
        userId,
        attendanceDate,
        checkIn: { not: null },
        checkOut: null,
      },
      include: {
        breaks: true,
      },
    });
  }

  async createCheckIn(data, tx = prisma) {
    return tx.attendance.create({
      data,
      include: {
        breaks: true,
        user: {
          include: { department: true },
        },
      },
    });
  }

  async updateCheckOut(id, updateData, tx = prisma) {
    return tx.attendance.update({
      where: { id },
      data: updateData,
      include: {
        breaks: true,
        user: {
          include: { department: true },
        },
      },
    });
  }

  async updateRecord(id, updateData, tx = prisma) {
    return tx.attendance.update({
      where: { id },
      data: updateData,
      include: {
        breaks: true,
        user: {
          include: { department: true },
        },
        auditLogs: true,
      },
    });
  }

  async findUserHistory(userId, { startDate, endDate } = {}) {
    const where = { userId };

    if (startDate && endDate) {
      where.attendanceDate = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      where.attendanceDate = { gte: startDate };
    } else if (endDate) {
      where.attendanceDate = { lte: endDate };
    }

    return prisma.attendance.findMany({
      where,
      include: {
        breaks: true,
        auditLogs: true,
      },
      orderBy: { attendanceDate: 'desc' },
    });
  }

  async findWorkforceAttendance({ date, startDate, endDate, departmentId, search, status } = {}) {
    const where = {};

    if (date) {
      where.attendanceDate = date;
    } else if (startDate || endDate) {
      where.attendanceDate = {};
      if (startDate) where.attendanceDate.gte = startDate;
      if (endDate) where.attendanceDate.lte = endDate;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (departmentId || search) {
      where.user = {};
      if (departmentId && departmentId !== 'ALL') {
        where.user.departmentId = departmentId;
      }
      if (search) {
        where.user.OR = [
          { fullName: { contains: search } },
          { email: { contains: search } },
        ];
      }
    }

    return prisma.attendance.findMany({
      where,
      include: {
        breaks: true,
        auditLogs: {
          include: { performer: true },
          orderBy: { createdAt: 'desc' },
        },
        user: {
          include: { department: true },
        },
      },
      orderBy: [
        { attendanceDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getRecentWorkforceStats(dateStr) {
    const totalUsers = await prisma.user.count({
      where: { role: 'Employee' },
    });

    const attendances = await prisma.attendance.findMany({
      where: { attendanceDate: dateStr },
      include: { user: true },
    });

    const presentCount = attendances.filter(
      (a) => a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day'
    ).length;

    const lateCount = attendances.filter((a) => a.status === 'Late').length;
    const halfDayCount = attendances.filter((a) => a.status === 'Half Day').length;
    const remoteCount = attendances.filter((a) => a.isOutOfBounds).length;
    const absentCount = Math.max(0, totalUsers - presentCount);

    return {
      totalEmployees: totalUsers,
      presentToday: presentCount,
      lateToday: lateCount,
      halfDayToday: halfDayCount,
      remoteToday: remoteCount,
      absentToday: absentCount,
      attendanceRate: totalUsers > 0 ? Math.round((presentCount / totalUsers) * 100) : 0,
    };
  }
}

module.exports = new AttendanceRepository();
