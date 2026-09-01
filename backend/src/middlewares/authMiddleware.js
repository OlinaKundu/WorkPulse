const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/prisma');

/**
 * Authentication Middleware: Validates Bearer JWT tokens and attaches authenticated user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        department: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists',
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: user.department ? user.department.name : 'General',
      leaveBalance: user.leaveBalance,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired, please log in again',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Failed to authenticate token',
      error: error.message,
    });
  }
}

module.exports = {
  authenticate,
};
