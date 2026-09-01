const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning database and setting up fresh enterprise baseline...');

  // Delete all attendance logs, breaks, and audit logs
  await prisma.auditLog.deleteMany();
  await prisma.break.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // Create Departments
  const deptEngineering = await prisma.department.create({
    data: { name: 'Engineering & Technology' },
  });

  const deptOperations = await prisma.department.create({
    data: { name: 'Consulting & Business Operations' },
  });

  // Passwords
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const employeePasswordHash = await bcrypt.hash('Employee@123', 10);

  // 1. HR Admin
  await prisma.user.create({
    data: {
      fullName: 'Vikram Mehta',
      email: 'admin@innereye.com',
      passwordHash: adminPasswordHash,
      role: 'HR',
      leaveBalance: 24.0,
      departmentId: deptOperations.id,
    },
  });

  // 2. Active Employee accounts
  await prisma.user.create({
    data: {
      fullName: 'John Doe',
      email: 'john.doe@innereye.com',
      passwordHash: employeePasswordHash,
      role: 'Employee',
      leaveBalance: 20.0,
      departmentId: deptEngineering.id,
    },
  });

  await prisma.user.create({
    data: {
      fullName: 'Alex Rivera',
      email: 'alex.rivera@innereye.com',
      passwordHash: employeePasswordHash,
      role: 'Employee',
      leaveBalance: 20.0,
      departmentId: deptEngineering.id,
    },
  });

  console.log('✅ Clean baseline configured: 1 HR Admin & 2 Default Employees (plus custom registered accounts).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
