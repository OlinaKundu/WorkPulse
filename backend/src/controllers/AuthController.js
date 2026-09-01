const authService = require('../services/AuthService');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const { fullName, email, password, role, departmentId, adminPasscode } = req.body;
      const result = await authService.register({
        fullName,
        email,
        password,
        role,
        departmentId,
        adminPasscode,
      });
      return res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.id);
      return res.status(200).json({
        success: true,
        user: profile,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
