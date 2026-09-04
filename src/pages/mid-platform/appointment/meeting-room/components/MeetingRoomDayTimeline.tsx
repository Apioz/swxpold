import dayjs from 'dayjs';
import {
  getReservationDayBlocks,
  timeRangeToPercent,
} from '../../../../../data/mockMeetingReservationSchedule';

/** 列表页空间状态固定展示日期，与示意图一致 */
export const MEETING_RESERVATION_LIST_DATE = '2026-09-03';

interface MeetingRoomDayTimelineProps {
  roomId: string;
  dateKey?: string;
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

function isHourBooked(blocks: ReturnType<typeof getReservationDayBlocks>, hour: number): boolean {
  const hourStart = hour * 60;
  const hourEnd = (hour + 1) * 60;

  return blocks.some((block) => {
    const [sh, sm] = block.start.split(':').map(Number);
    const [eh, em] = block.end.split(':').map(Number);
    const blockStart = sh * 60 + (sm ?? 0);
    const blockEnd = eh * 60 + (em ?? 0);
    return blockStart < hourEnd && blockEnd > hourStart;
  });
}

export default function MeetingRoomDayTimeline({
  roomId,
  dateKey = MEETING_RESERVATION_LIST_DATE,
}: MeetingRoomDayTimelineProps) {
  const blocks = getReservationDayBlocks(roomId, dateKey);

  return (
    <div className="meeting-reservation-day-timeline">
      <div className="meeting-reservation-day-timeline-hours">
        {HOUR_LABELS.map((hour) => (
          <span key={hour} className="meeting-reservation-day-timeline-hour">
            {hour}
          </span>
        ))}
      </div>
      <div className="meeting-reservation-day-timeline-grid">
        {HOUR_LABELS.map((hour, index) => (
          <span
            key={hour}
            className={`meeting-reservation-day-timeline-cell${
              isHourBooked(blocks, index) ? ' is-booked' : ''
            }`}
          />
        ))}
        {blocks.map((block) => {
          const { left, width } = timeRangeToPercent(block.start, block.end);
          return (
            <span
              key={`${block.start}-${block.end}-${block.title}`}
              className="meeting-reservation-day-timeline-block"
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${block.title} ${block.start}-${block.end}`}
            />
          );
        })}
      </div>
      <div className="meeting-reservation-day-timeline-date">
        {dayjs(dateKey).format('YYYY-MM-DD')}
      </div>
    </div>
  );
}
