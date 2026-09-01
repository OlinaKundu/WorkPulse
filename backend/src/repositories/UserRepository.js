const prisma = require('../config/prisma');

class UserRepository {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { department: true },
    });
  }

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: { department: true },
    });
  }

  async findAllEmployees() {
    return prisma.user.findMany({
      where: { role: 'Employee' },
      include: { department: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async findAllUsers() {
    return prisma.user.findMany({
      include: { department: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async createUser(data) {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
      },
      include: { department: true },
    });
  }

  async updateLeaveBalance(userId, newBalance, tx = prisma) {
    return tx.user.update({
      where: { id: userId },
      data: { leaveBalance: parseFloat(newBalance) },
    });
  }

  async deductLeaveBalance(userId, amount, tx = prisma) {
    if (amount <= 0) return null;
    return tx.user.update({
      where: { id: userId },
      data: {
        leaveBalance: {
          decrement: parseFloat(amount),
        },
      },
    });
  }

  async deleteUser(userId, tx = prisma) {
    return tx.user.delete({
      where: { id: userId },
    });
  }
}

module.exports = new UserRepository();
