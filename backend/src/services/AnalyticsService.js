const prisma = require('../config/prisma');
const userRepository = require('../repositories/UserRepository');

class AnalyticsService {
  /**
   * Calculates Attendance Integrity Score (0-100%) for a single employee
   * Based on late arrivals, missing check-outs, absences, and out of bounds check-ins.
   */
  calculateIntegrityScoreFromRecords(records = [], totalWorkingDays = 30) {
    if (!records || records.length === 0) {
      return {
        score: 100,
        grade: 'A+',
        level: 'Excellent',
        stats: {
          totalDays: 0,
          presentCount: 0,
          lateCount: 0,
          absentCount: 0,
          halfDayCount: 0,
          missingCheckoutCount: 0,
          remoteCount: 0,
          avgDailyHours: 0,
        },
      };
    }

    let lateCount = 0;
    let absentCount = 0;
    let halfDayCount = 0;
    let missingCheckoutCount = 0;
    let remoteCount = 0;
    let presentCount = 0;
    let totalWorkingHours = 0;

    for (const r of records) {
      totalWorkingHours += r.workingHours || 0;

      if (r.status === 'Late') lateCount++;
      if (r.status === 'Absent') absentCount++;
      if (r.status === 'Half Day') halfDayCount++;
      if (r.status === 'Present') presentCount++;
      if (r.checkIn && !r.checkOut) missingCheckoutCount++;
      if (r.isOutOfBounds) remoteCount++;
    }

    // Weight penalty deductions
    // Late: -3, Missing Checkout: -7, Absent: -10, Half Day: -4, Remote: -2
    const penalty =
      lateCount * 3 +
      missingCheckoutCount * 7 +
      absentCount * 10 +
      halfDayCount * 4 +
      remoteCount * 2;

    const rawScore = Math.max(0, Math.min(100, 100 - penalty));
    const score = Math.round(rawScore * 10) / 10;

    let grade = 'A+';
    let level = 'Excellent';
    if (score < 60) {
      grade = 'D';
      level = 'Critical Anomaly';
    } else if (score < 75) {
      grade = 'C';
      level = 'Needs Improvement';
    } else if (score < 90) {
      grade = 'B';
      level = 'Good';
    }

    const avgDailyHours =
      records.length > 0
        ? Math.round((totalWorkingHours / records.length) * 100) / 100
        : 0;

    return {
      score,
      grade,
      level,
      stats: {
        totalDays: records.length,
        presentCount,
        lateCount,
        absentCount,
        halfDayCount,
        missingCheckoutCount,
        remoteCount,
        avgDailyHours,
        totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
      },
    };
  }

  /**
   * Helper to partition attendance logs into rolling 7-day calendar weeks
   */
  groupAttendanceIntoWeeks(records = []) {
    // Sort records ascending by date
    const sorted = [...records].sort(
      (a, b) => new Date(a.attendanceDate).getTime() - new Date(b.attendanceDate).getTime()
    );

    const weekBuckets = {};

    for (const r of sorted) {
      const date = new Date(r.attendanceDate);
      // Determine ISO week or Monday start week key
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(date.setDate(diff));
      const weekKey = monday.toISOString().split('T')[0];

      if (!weekBuckets[weekKey]) {
        weekBuckets[weekKey] = {
          weekStart: weekKey,
          totalHours: 0,
          daysWorked: 0,
        };
      }

      weekBuckets[weekKey].totalHours += r.workingHours || 0;
      weekBuckets[weekKey].daysWorked += 1;
    }

    // Convert to sorted array of weeks
    const weeksArray = Object.values(weekBuckets).map((w) => ({
      weekStart: w.weekStart,
      totalHours: Math.round(w.totalHours * 100) / 100,
      daysWorked: w.daysWorked,
    }));

    return weeksArray;
  }

  /**
   * Evaluates Burnout Risk for an employee:
   * Flags high risk if employee logs > 50 working hours/week for 3 consecutive weeks
   */
  evaluateBurnoutRisk(records = []) {
    const weeklyData = this.groupAttendanceIntoWeeks(records);

    let maxConsecutiveHighWeeks = 0;
    let currentConsecutiveHighWeeks = 0;
    let totalHoursAllWeeks = 0;

    for (const week of weeklyData) {
      totalHoursAllWeeks += week.totalHours;
      if (week.totalHours > 50.0) {
        currentConsecutiveHighWeeks += 1;
        if (currentConsecutiveHighWeeks > maxConsecutiveHighWeeks) {
          maxConsecutiveHighWeeks = currentConsecutiveHighWeeks;
        }
      } else {
        currentConsecutiveHighWeeks = 0;
      }
    }

    const avgWeeklyHours =
      weeklyData.length > 0
        ? Math.round((totalHoursAllWeeks / weeklyData.length) * 100) / 100
        : 0;

    let riskLevel = 'Healthy';
    let riskBadgeColor = 'emerald';
    let alertMessage = 'Workload is within healthy parameters (< 45h/week).';

    if (maxConsecutiveHighWeeks >= 3 || currentConsecutiveHighWeeks >= 3) {
      riskLevel = 'High Risk';
      riskBadgeColor = 'rose';
      alertMessage = `High Burnout Risk Alert: Employee has exceeded 50 working hours/week for ${Math.max(
        maxConsecutiveHighWeeks,
        currentConsecutiveHighWeeks
      )} consecutive weeks! Immediate workload intervention recommended.`;
    } else if (maxConsecutiveHighWeeks >= 1 || avgWeeklyHours >= 45.0) {
      riskLevel = 'Moderate Risk';
      riskBadgeColor = 'amber';
      alertMessage = 'Moderate Overwork Notice: Weekly hours elevated above 45h. Monitor overtime trends.';
    }

    return {
      riskLevel,
      riskBadgeColor,
      isHighBurnoutAlert: maxConsecutiveHighWeeks >= 3 || currentConsecutiveHighWeeks >= 3,
      consecutiveWeeksOver50h: Math.max(maxConsecutiveHighWeeks, currentConsecutiveHighWeeks),
      avgWeeklyHours,
      weeklyBreakdown: weeklyData,
      alertMessage,
    };
  }

  /**
   * HR Workforce Analytics Engine: Returns full employee metrics, burnout risks, and integrity scores
   */
  async getWorkforceAnalytics() {
    const employees = await prisma.user.findMany({
      where: { role: 'Employee' },
      include: {
        department: true,
        attendances: {
          include: { breaks: true },
          orderBy: { attendanceDate: 'desc' },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    const employeeAnalytics = employees.map((emp) => {
      const integrity = this.calculateIntegrityScoreFromRecords(emp.attendances);
      const burnout = this.evaluateBurnoutRisk(emp.attendances);

      return {
        userId: emp.id,
        fullName: emp.fullName,
        email: emp.email,
        department: emp.department ? emp.department.name : 'General',
        leaveBalance: emp.leaveBalance,
        totalLogs: emp.attendances.length,
        integrityScore: integrity.score,
        integrityGrade: integrity.grade,
        integrityLevel: integrity.level,
        integrityStats: integrity.stats,
        burnoutRisk: burnout.riskLevel,
        isHighBurnoutAlert: burnout.isHighBurnoutAlert,
        burnoutDetails: burnout,
      };
    });

    // Calculate aggregated workforce integrity metrics
    const totalEmployees = employeeAnalytics.length;
    const highBurnoutCount = employeeAnalytics.filter((e) => e.isHighBurnoutAlert).length;
    const moderateBurnoutCount = employeeAnalytics.filter((e) => e.burnoutRisk === 'Moderate Risk').length;
    const avgIntegrityScore =
      totalEmployees > 0
        ? Math.round(
            (employeeAnalytics.reduce((acc, curr) => acc + curr.integrityScore, 0) /
              totalEmployees) *
              10
          ) / 10
        : 100;

    return {
      summary: {
        totalEmployees,
        highBurnoutCount,
        moderateBurnoutCount,
        healthyCount: totalEmployees - highBurnoutCount - moderateBurnoutCount,
        avgIntegrityScore,
      },
      employees: employeeAnalytics,
    };
  }

  /**
   * Analytics for individual employee view
   */
  async getEmployeePersonalAnalytics(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const attendances = await prisma.attendance.findMany({
      where: { userId },
      include: { breaks: true },
      orderBy: { attendanceDate: 'desc' },
    });

    const integrity = this.calculateIntegrityScoreFromRecords(attendances);
    const burnout = this.evaluateBurnoutRisk(attendances);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        department: user.department ? user.department.name : 'General',
        leaveBalance: user.leaveBalance,
      },
      integrity,
      burnout,
      attendances,
    };
  }
}

module.exports = new AnalyticsService();
