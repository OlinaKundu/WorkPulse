const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/UserRepository');
const { generateToken } = require('../utils/jwt');

class AuthService {
  async login(email, password) {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      throw err;
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department ? user.department.name : null,
        departmentId: user.departmentId,
        leaveBalance: user.leaveBalance,
        createdAt: user.createdAt,
      },
    };
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department ? user.department.name : null,
      departmentId: user.departmentId,
      leaveBalance: user.leaveBalance,
      createdAt: user.createdAt,
    };
  }

  async register({ fullName, email, password, role = 'Employee', departmentId, adminPasscode }) {
    if (!fullName || !email || !password) {
      const err = new Error('Full name, email, and password are required.');
      err.statusCode = 400;
      throw err;
    }

    const requestedRole = role === 'HR' ? 'HR' : 'Employee';

    // Security Gate: Restrict HR / Admin account creation to authorized administrators with security key
    if (requestedRole === 'HR') {
      const expectedKey = process.env.ADMIN_REGISTRATION_KEY || 'Admin@123';
      if (!adminPasscode || adminPasscode.trim() !== expectedKey) {
        const err = new Error('Invalid Admin Security Key. Only authorized organization administrators can register HR / Admin accounts.');
        err.statusCode = 403;
        throw err;
      }
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('An account with this email address already exists.');
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await userRepository.createUser({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: requestedRole,
      departmentId: departmentId || null,
      leaveBalance: requestedRole === 'HR' ? 24.0 : 20.0,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department ? user.department.name : null,
        departmentId: user.departmentId,
        leaveBalance: user.leaveBalance,
        createdAt: user.createdAt,
      },
    };
  }
}

module.exports = new AuthService();
