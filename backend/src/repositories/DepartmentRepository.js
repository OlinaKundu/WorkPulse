const prisma = require('../config/prisma');

class DepartmentRepository {
  async findAll() {
    return prisma.department.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findByName(name) {
    return prisma.department.findUnique({
      where: { name },
    });
  }

  async create(name) {
    return prisma.department.create({
      data: { name },
    });
  }
}

module.exports = new DepartmentRepository();
