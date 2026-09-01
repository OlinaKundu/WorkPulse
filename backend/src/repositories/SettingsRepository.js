const prisma = require('../config/prisma');

class SettingsRepository {
  async get(key) {
    const record = await prisma.companySetting.findUnique({
      where: { key },
    });
    return record ? record.value : null;
  }

  async set(key, value) {
    return prisma.companySetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }

  async getOfficeSettings() {
    const [address, lat, lon, radius] = await Promise.all([
      this.get('office_address'),
      this.get('office_latitude'),
      this.get('office_longitude'),
      this.get('geofence_radius_meters'),
    ]);

    return {
      address: address || process.env.OFFICE_ADDRESS || 'Corporate Headquarters, Innovation Tower',
      latitude: lat ? parseFloat(lat) : (parseFloat(process.env.OFFICE_LATITUDE) || 12.971598),
      longitude: lon ? parseFloat(lon) : (parseFloat(process.env.OFFICE_LONGITUDE) || 77.594562),
      radiusMeters: radius ? parseFloat(radius) : (parseFloat(process.env.GEOFENCE_RADIUS_METERS) || 200),
    };
  }

  async updateOfficeSettings({ address, latitude, longitude, radiusMeters }) {
    const tasks = [];
    if (address !== undefined) tasks.push(this.set('office_address', address.trim()));
    if (latitude !== undefined) tasks.push(this.set('office_latitude', parseFloat(latitude)));
    if (longitude !== undefined) tasks.push(this.set('office_longitude', parseFloat(longitude)));
    if (radiusMeters !== undefined) tasks.push(this.set('geofence_radius_meters', parseFloat(radiusMeters)));

    await Promise.all(tasks);
    return this.getOfficeSettings();
  }

  async getEmailSettings() {
    const [smtpUser, smtpPass, smtpHost, smtpPort, senderName] = await Promise.all([
      this.get('smtp_user'),
      this.get('smtp_pass'),
      this.get('smtp_host'),
      this.get('smtp_port'),
      this.get('email_sender_name'),
    ]);

    return {
      smtpUser: smtpUser || process.env.SMTP_USER || '',
      smtpPass: smtpPass || process.env.SMTP_PASS || '',
      smtpHost: smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: smtpPort ? parseInt(smtpPort, 10) : (parseInt(process.env.SMTP_PORT, 10) || 587),
      senderName: senderName || process.env.EMAIL_SENDER_NAME || 'WorkPulse HR',
      isConfigured: !!(smtpUser || process.env.SMTP_USER),
    };
  }

  async updateEmailSettings({ smtpUser, smtpPass, smtpHost, smtpPort, senderName }) {
    const tasks = [];
    if (smtpUser !== undefined) tasks.push(this.set('smtp_user', smtpUser.trim()));
    if (smtpPass !== undefined) tasks.push(this.set('smtp_pass', smtpPass.trim()));
    if (smtpHost !== undefined) tasks.push(this.set('smtp_host', smtpHost.trim()));
    if (smtpPort !== undefined) tasks.push(this.set('smtp_port', String(smtpPort)));
    if (senderName !== undefined) tasks.push(this.set('email_sender_name', senderName.trim()));

    await Promise.all(tasks);
    return this.getEmailSettings();
  }
}

module.exports = new SettingsRepository();
