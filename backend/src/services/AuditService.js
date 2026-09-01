const auditRepository = require('../repositories/AuditRepository');

class AuditService {
  async getAuditLogs(options = {}) {
    return auditRepository.findAllLogs(options);
  }

  async getLogsForAttendance(attendanceId) {
    return auditRepository.findLogsByAttendanceId(attendanceId);
  }
}

module.exports = new AuditService();
