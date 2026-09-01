const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Inner Eye Attendance System...');

  // Clean existing tables in correct order
  await prisma.auditLog.deleteMany();
  await prisma.break.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log('🧹 Cleaned existing database tables.');

  // 1. Create Departments
  const deptEngineering = await prisma.department.create({
    data: { name: 'Software Engineering' },
  });

  const deptConsulting = await prisma.department.create({
    data: { name: 'HR & Consulting Operations' },
  });

  console.log('✅ Created Departments:', deptEngineering.name, ',', deptConsulting.name);

  // 2. Hash default passwords
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const employeePasswordHash = await bcrypt.hash('Employee@123', 10);

  // 3. Create HR Admin User
  const adminUser = await prisma.user.create({
    data: {
      fullName: 'Vikram Mehta (HR Director)',
      email: 'admin@innereye.com',
      passwordHash: adminPasswordHash,
      role: 'HR',
      leaveBalance: 24.0,
      departmentId: deptConsulting.id,
    },
  });

  // 4. Create 5 Employee Users
  const employee1 = await prisma.user.create({
    data: {
      fullName: 'John Doe',
      email: 'john.doe@innereye.com',
      passwordHash: employeePasswordHash,
      role: 'Employee',
      leaveBalance: 18.0,
      departmentId: deptEngineering.id,
    },
  });

  const employee2 = await prisma.user.create({
    data: {
      fullName: 'Jane Smith',
      email: 'jane.smith@innereye.com',
      passwordHash: employeePasswordHash,
      role: 'Employee',
      leaveBalance: 20.0,
      departmentId: deptEngineering.id,
    },
  });

  // Employee 3: Alex Rivera (High burnout candidate: logs >50h/wk for past 3+ weeks)
  const employee3 = await prisma.user.create({
    data: {
      fullName: 'Alex Rivera (Lead Architect)',
      email: 'alex.rivera@innereye.com',
      passwordHash: employeePasswordHash,
      role: 'Employee',
      leaveBalance: 15.0,
      departmentId: deptEngineering.id,
    },
  });

  // Employee 4: Priya Sharma (High on-time score)
  const employee4 = await prisma.user.create({
    data: {
      fullName: 'Priya Sharma',
      email: 'priya.sharma@innereye.com',
      passwordHash: employeePasswordHash,
      role: 'Employee',
      leaveBalance: 19.5,
      departmentId: deptConsulting.id,
    },
  });

  // Employee 5: Michael Chen (Occasional late arrivals & half days)
  const employee5 = await prisma.user.create({
    data: {
      fullName: 'Michael Chen',
      email: 'michael.chen@innereye.com',
      passwordHash: employeePasswordHash,
      role: 'Employee',
      leaveBalance: 16.0,
      departmentId: deptConsulting.id,
    },
  });

  const employees = [employee1, employee2, employee3, employee4, employee5];
  console.log('✅ Created 1 HR Admin & 5 Employees.');

  // 5. Generate 30 days of realistic synthetic historical attendance data
  const baseDate = new Date();
  const officeLat = 12.971598;
  const officeLon = 77.594562;

  let totalAttendanceCount = 0;
  let totalBreaksCount = 0;
  let sampleAttendanceForAudit = null;

  for (let d = 30; d >= 1; d--) {
    const dayDate = new Date();
    dayDate.setDate(baseDate.getDate() - d);

    // Skip weekends for realistic work calendar
    const dayOfWeek = dayDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = dayDate.toISOString().split('T')[0];

    for (const emp of employees) {
      let isLate = false;
      let isAbsent = false;
      let isHalfDay = false;
      let isBurnoutShift = false;
      let isRemote = false;

      // Custom profiles per employee
      if (emp.id === employee3.id) {
        // Alex Rivera: High hours (~10.5 to 11.5 hours/day) to hit >50h/wk
        isBurnoutShift = true;
      } else if (emp.id === employee5.id && (d % 6 === 0)) {
        // Michael Chen: late occasionally
        isLate = true;
      } else if (emp.id === employee5.id && d === 12) {
        isHalfDay = true;
      } else if (emp.id === employee1.id && d === 18) {
        isAbsent = true;
      } else if (emp.id === employee2.id && (d % 7 === 0)) {
        isRemote = true; // remote geofence flag
      }

      if (isAbsent) {
        // Log absent day
        await prisma.attendance.create({
          data: {
            userId: emp.id,
            attendanceDate: dateStr,
            checkIn: null,
            checkOut: null,
            workingHours: 0.0,
            status: 'Absent',
            leaveDeducted: 1.0,
            isOutOfBounds: false,
          },
        });
        totalAttendanceCount++;
        continue;
      }

      // Check-in time calculation
      const checkIn = new Date(dayDate);
      if (isLate) {
        checkIn.setHours(9, 48 + Math.floor(Math.random() * 20), 0, 0); // 09:48 - 10:08 AM
      } else {
        checkIn.setHours(9, 10 + Math.floor(Math.random() * 15), 0, 0); // 09:10 - 09:25 AM
      }

      // Working duration calculation
      let workingHours = 8.2 + (Math.random() * 0.6); // standard ~8.5 hours
      if (isBurnoutShift) {
        workingHours = 10.5 + (Math.random() * 0.8); // ~11 hours
      } else if (isHalfDay) {
        workingHours = 4.2;
      }

      const checkOut = new Date(checkIn.getTime() + (workingHours + 0.8) * 3600 * 1000); // 0.8h lunch included
      const status = isHalfDay ? 'Half Day' : isLate ? 'Late' : 'Present';
      const leaveDeducted = isHalfDay ? 0.5 : 0.0;

      const latitude = isRemote ? officeLat + 0.008 : officeLat + (Math.random() * 0.0002);
      const longitude = isRemote ? officeLon + 0.008 : officeLon + (Math.random() * 0.0002);
      const distanceMeters = isRemote ? 1150.0 : 45.0 + Math.random() * 30;

      const attRecord = await prisma.attendance.create({
        data: {
          userId: emp.id,
          attendanceDate: dateStr,
          checkIn,
          checkOut,
          workingHours: Math.round(workingHours * 100) / 100,
          status,
          leaveDeducted,
          isOutOfBounds: isRemote,
          latitude,
          longitude,
          distanceMeters: Math.round(distanceMeters),
        },
      });

      if (!sampleAttendanceForAudit && isLate) {
        sampleAttendanceForAudit = attRecord;
      }

      totalAttendanceCount++;

      // Create Lunch break for the shift
      const lunchStart = new Date(checkIn.getTime() + 3.5 * 3600 * 1000);
      const lunchEnd = new Date(lunchStart.getTime() + 45 * 60 * 1000); // 45 min

      await prisma.break.create({
        data: {
          attendanceId: attRecord.id,
          breakStart: lunchStart,
          breakEnd: lunchEnd,
          breakType: 'Lunch',
          durationMinutes: 45.0,
        },
      });
      totalBreaksCount++;

      // Occasional coffee break
      if (isBurnoutShift || Math.random() > 0.5) {
        const coffeeStart = new Date(checkIn.getTime() + 6.5 * 3600 * 1000);
        const coffeeEnd = new Date(coffeeStart.getTime() + 15 * 60 * 1000); // 15 min
        await prisma.break.create({
          data: {
            attendanceId: attRecord.id,
            breakStart: coffeeStart,
            breakEnd: coffeeEnd,
            breakType: 'Coffee',
            durationMinutes: 15.0,
          },
        });
        totalBreaksCount++;
      }
    }
  }

  console.log(`✅ Generated ${totalAttendanceCount} historical attendance logs and ${totalBreaksCount} break records across 30 days.`);

  // 6. Generate Sample Immutable Audit Logs
  if (sampleAttendanceForAudit) {
    await prisma.auditLog.create({
      data: {
        performedBy: adminUser.id,
        targetAttendanceId: sampleAttendanceForAudit.id,
        targetUserId: sampleAttendanceForAudit.userId,
        action: 'ATTENDANCE_OVERRIDE',
        oldValue: JSON.stringify({
          status: 'Late',
          workingHours: 7.8,
          reason: 'Initial check-in marked late',
        }),
        newValue: JSON.stringify({
          status: 'Present',
          workingHours: 8.5,
          reason: 'Client-facing morning offsite approved by Management',
        }),
      },
    });

    await prisma.auditLog.create({
      data: {
        performedBy: adminUser.id,
        targetUserId: employee2.id,
        action: 'LEAVE_BALANCE_OVERRIDE',
        oldValue: JSON.stringify({ leaveBalance: 19.0 }),
        newValue: JSON.stringify({ leaveBalance: 20.0, reason: 'Annual Leave rollover credit adjustment' }),
      },
    });

    console.log('✅ Created sample immutable HR Audit Trail logs.');
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
