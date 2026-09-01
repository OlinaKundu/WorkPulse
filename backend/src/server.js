const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 WorkPulse Enterprise Attendance System API running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🏢 Enterprise Edition: WorkPulse Multi-Department Management`);
  console.log('====================================================');
});

module.exports = server;
