import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates an official Monthly Attendance & Productivity Transcript PDF
 *
 * @param {Object} employee Employee profile
 * @param {Array} records Attendance records for the period
 * @param {Object} analytics Integrity & hours metrics
 */
export function generateEmployeeAttendancePDF(employee, records = [], analytics = {}) {
  const doc = new jsPDF();

  // Color Palette (Monochrome Slate)
  const primaryColor = [24, 24, 27]; // Dark Slate #18181B
  const darkTextColor = [30, 41, 59]; // Slate 800
  const lightTextColor = [100, 116, 139]; // Slate 500

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('WORKPULSE ENTERPRISE', 14, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(212, 212, 216);
  doc.text('Employee Attendance & Shift Productivity Transcript', 115, 15);

  // 2. Employee & Period Info Block
  doc.setTextColor(...darkTextColor);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Official Monthly Attendance Summary', 14, 36);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightTextColor);
  doc.text(`Generated On: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 42);

  // Info Grid Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 46, 182, 28, 2, 2, 'FD');

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Name:', 18, 54);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.fullName || 'N/A', 52, 54);

  doc.setFont('helvetica', 'bold');
  doc.text('Department:', 18, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.department || 'General', 52, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('Email Address:', 18, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(employee.email || 'N/A', 52, 70);

  doc.setFont('helvetica', 'bold');
  doc.text('Current Leave Balance:', 115, 54);
  doc.setFont('helvetica', 'normal');
  doc.text(`${employee.leaveBalance !== undefined ? employee.leaveBalance : 20.0} Days`, 165, 54);

  doc.setFont('helvetica', 'bold');
  doc.text('Integrity Score:', 115, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(`${analytics.integrity?.score || 100}% (${analytics.integrity?.level || 'Excellent'})`, 165, 62);

  doc.setFont('helvetica', 'bold');
  doc.text('Burnout Risk Index:', 115, 70);
  doc.setFont('helvetica', 'normal');
  doc.text(`${analytics.burnout?.riskLevel || 'Healthy'}`, 165, 70);

  // 3. Attendance Log Table
  const tableRows = records.map((r) => [
    r.attendanceDate,
    r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    `${(r.workingHours || 0).toFixed(2)} hrs`,
    r.breaks ? `${r.breaks.length} breaks` : '0 breaks',
    r.status,
    r.leaveDeducted > 0 ? `-${r.leaveDeducted}d` : '0.0d',
    r.isOutOfBounds ? 'Remote / Out of Bounds' : 'Office',
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['Date', 'Check In', 'Check Out', 'Hours', 'Breaks', 'Status', 'Leave Ded.', 'Location']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // 4. Summary & Verification Footer
  const finalY = doc.lastAutoTable.finalY || 200;

  if (finalY < 250) {
    doc.setFontSize(8);
    doc.setTextColor(...lightTextColor);
    doc.text('---------------------------------------------------------------------------------------------------------------------------------', 14, finalY + 12);
    doc.text('WorkPulse Enterprise - Confidential Attendance Transcript', 14, finalY + 18);
    doc.text('System Authorized Signatory: Auto-Generated via Enterprise Attendance Engine', 14, finalY + 23);
  }

  // Save Document
  const filename = `Attendance_Summary_${(employee.fullName || 'Employee').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Generates an official Workforce Executive Attendance Summary PDF (for HR)
 */
export function generateWorkforceSummaryPDF(records = [], stats = {}, dateStr = '') {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('WORKPULSE ENTERPRISE', 14, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(212, 212, 216);
  doc.text('Workforce Attendance & Compliance Master Report', 115, 15);

  // Subhead
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Workforce Attendance Audit - Report Period: ${dateStr || 'All Records'}`, 14, 35);

  // Stats Highlights Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 40, 182, 22, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Records: ${records.length}`, 20, 52);
  doc.text(`Present: ${stats.presentToday || 0}`, 70, 52);
  doc.text(`Late: ${stats.lateToday || 0}`, 115, 52);
  doc.text(`Absent: ${stats.absentToday || 0}`, 155, 52);

  // Table
  const tableRows = records.map((r) => [
    r.attendanceDate,
    r.user?.fullName || 'N/A',
    r.user?.department?.name || 'General',
    r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
    `${(r.workingHours || 0).toFixed(2)}h`,
    r.status,
    r.isOutOfBounds ? 'Remote' : 'Office',
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['Date', 'Employee Name', 'Department', 'Check In', 'Check Out', 'Hours', 'Status', 'Geo']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  const filename = `Workforce_Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
