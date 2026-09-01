const auditService = require('../services/AuditService');

class AuditController {
  async getAuditLogs(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const logs = await auditService.getAuditLogs({ page, limit });
      return res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceAuditHistory(req, res, next) {
    try {
      const { attendanceId } = req.params;
      const logs = await auditService.getLogsForAttendance(attendanceId);
      return res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
