const userRepository = require('../repositories/UserRepository');
const departmentRepository = require('../repositories/DepartmentRepository');

class UserController {
  async getAllEmployees(req, res, next) {
    try {
      const employees = await userRepository.findAllEmployees();
      const sanitized = employees.map((emp) => ({
        id: emp.id,
        fullName: emp.fullName,
        email: emp.email,
        role: emp.role,
        departmentId: emp.departmentId,
        department: emp.department ? emp.department.name : 'General',
        leaveBalance: emp.leaveBalance,
        createdAt: emp.createdAt,
      }));

      return res.status(200).json({
        success: true,
        data: sanitized,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllDepartments(req, res, next) {
    try {
      const departments = await departmentRepository.findAll();
      return res.status(200).json({
        success: true,
        data: departments,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
