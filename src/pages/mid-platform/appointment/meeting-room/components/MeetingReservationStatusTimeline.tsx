import dayjs from 'dayjs';
import {
  getReservationDayBlocks,
  timeRangeToPercent,
} from '../../../../../data/mockMeetingReservationSchedule';

interface MeetingReservationStatusTimelineProps {
  roomId: string;
  dateKey: string;
  startTime?: string;
  endTime?: string;
}

export default function MeetingReservationStatusTimeline({
  roomId,
  dateKey,
  startTime,
  endTime,
}: MeetingReservationStatusTimelineProps) {
  const blocks = getReservationDayBlocks(roomId, dateKey);
  const now = dayjs();
  const showNowMarker = dateKey === now.format('YYYY-MM-DD');
  const nowPercent = showNowMarker
    ? timeRangeToPercent(now.format('HH:mm'), now.add(1, 'minute').format('HH:mm')).left
    : null;
  const selectionPercent =
    startTime && endTime ? timeRangeToPercent(startTime, endTime) : null;

  return (
    <div className="meeting-reservation-status-timeline">
      <div className="meeting-reservation-status-timeline-head">
        <span>全天状态</span>
        <span>{dayjs(dateKey).format('YYYY-MM-DD')}</span>
      </div>
      <div className="meeting-reservation-status-timeline-axis">
        {Array.from({ length: 25 }, (_, i) => (
          <span key={i} className="meeting-reservation-status-timeline-tick">
            {String(i).padStart(2, '0')}
          </span>
        ))}
      </div>
      <div className="meeting-reservation-status-timeline-bar">
        {blocks.map((block) => {
          const { left, width } = timeRangeToPercent(block.start, block.end);
          return (
            <div
              key={`${block.start}-${block.title}`}
              className="meeting-reservation-status-timeline-booked"
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <span>{block.title}</span>
            </div>
          );
        })}
        {selectionPercent && (
          <div
            className="meeting-reservation-status-timeline-selection"
            style={{
              left: `${selectionPercent.left}%`,
              width: `${selectionPercent.width}%`,
            }}
          />
        )}
        {nowPercent !== null && (
          <div
            className="meeting-reservation-status-timeline-now"
            style={{ left: `${nowPercent}%` }}
          />
        )}
      </div>
    </div>
  );
}
