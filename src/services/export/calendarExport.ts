import type { TimelineMilestone, EventDetails } from '../../types/event';

/**
 * Generates an iCalendar (.ics) format file string for calendar export
 */
export function generateIcsCalendar(event: EventDetails, milestones: TimelineMilestone[]): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const formatIcsDate = (dateStr: string, timeStr?: string): string => {
    // If date is YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2].split('T')[0];
      if (timeStr && timeStr.includes(':')) {
        const [hour, minute] = timeStr.split(':');
        return `${year}${month}${day}T${pad(parseInt(hour, 10))}${pad(parseInt(minute, 10))}00`;
      }
      return `${year}${month}${day}`;
    }
    const d = new Date(dateStr);
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  };

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PlanVibe AI//Event Master Timeline//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${event.title} - Planning Timeline`
  ];

  for (const item of milestones) {
    const isDayOf = item.phase === 'day-of-run-of-show';
    const dateFormatted = formatIcsDate(item.dueDate, item.time);
    const uid = `planvibe-${item.id}-${Date.now()}@planvibe.app`;

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${uid}`);
    ics.push(`DTSTAMP:${formatIcsDate(new Date().toISOString())}`);
    if (isDayOf && item.time) {
      ics.push(`DTSTART:${dateFormatted}`);
      // Default duration: 45 min
      const parts = dateFormatted.split('T');
      if (parts[1]) {
        const h = parseInt(parts[1].substring(0, 2), 10);
        const m = parseInt(parts[1].substring(2, 4), 10);
        const endMinutes = m + 45;
        const endH = endMinutes >= 60 ? (h + 1) % 24 : h;
        const endM = endMinutes % 60;
        ics.push(`DTEND:${parts[0]}T${pad(endH)}${pad(endM)}00`);
      }
    } else {
      ics.push(`DTSTART;VALUE=DATE:${dateFormatted.split('T')[0]}`);
    }
    ics.push(`SUMMARY:${item.title.replace(/[,;]/g, ' ')}`);
    ics.push(`DESCRIPTION:${(item.description || item.title).replace(/[,;]/g, ' ')} [${item.phase}]`);
    ics.push(`LOCATION:${event.location.replace(/[,;]/g, ' ')}`);
    ics.push(`STATUS:${item.isCompleted ? 'COMPLETED' : 'CONFIRMED'}`);
    ics.push('END:VEVENT');
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

export function downloadCalendarFile(event: EventDetails, milestones: TimelineMilestone[]): void {
  const content = generateIcsCalendar(event, milestones);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_timeline.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
