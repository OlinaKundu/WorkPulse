import React from 'react';
import { Users, CheckCircle2, Clock, UserX, MapPin } from 'lucide-react';
import { MetricCard } from '../common/MetricCard';

export function WorkforceMetricsGrid({ stats = {} }) {
  const total = stats.totalEmployees || 0;
  const present = stats.presentToday || 0;
  const late = stats.lateToday || 0;
  const absent = stats.absentToday || 0;
  const remote = stats.remoteToday || 0;
  const rate = stats.attendanceRate || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
      <MetricCard
        title="Total Workforce"
        value={total}
        subtitle="Registered Staff"
        icon={Users}
      />
      <MetricCard
        title="Present Today"
        value={present}
        subtitle={`${rate}% attendance rate`}
        icon={CheckCircle2}
      />
      <MetricCard
        title="Late Arrivals"
        value={late}
        subtitle="After 09:30 AM"
        icon={Clock}
      />
      <MetricCard
        title="Absent Today"
        value={absent}
        subtitle="Unchecked / <4h"
        icon={UserX}
      />
      <MetricCard
        title="Remote Check-ins"
        value={remote}
        subtitle=">200m radius"
        icon={MapPin}
      />
    </div>
  );
}
