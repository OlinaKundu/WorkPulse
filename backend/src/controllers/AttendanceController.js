const attendanceService = require('../services/AttendanceService');

class AttendanceController {
  async checkIn(req, res, next) {
    try {
      const { latitude, longitude } = req.body;
      const result = await attendanceService.checkIn(req.user.id, { latitude, longitude });
      return res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkOut(req, res, next) {
    try {
      const result = await attendanceService.checkOut(req.user.id);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTodayStatus(req, res, next) {
    try {
      const result = await attendanceService.getTodayStatus(req.user.id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyHistory(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const history = await attendanceService.getUserHistory(req.user.id, { startDate, endDate });
      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
