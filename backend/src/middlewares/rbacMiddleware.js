/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to specified allowed roles
 *
 * @param  {...string} allowedRoles Roles that are permitted to access this endpoint
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
      });
    }

    next();
  };
}

module.exports = {
  requireRoles,
  requireHR: requireRoles('HR'),
};
