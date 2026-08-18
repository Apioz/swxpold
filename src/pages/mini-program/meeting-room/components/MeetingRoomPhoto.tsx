import { useState } from 'react';
import type { MeetingRoomDetail } from '../../../../data/mockMeetingRooms';
import './MeetingRoomPhoto.css';

interface MeetingRoomPhotoProps {
  room: Pick<MeetingRoomDetail, 'photoUrl' | 'name' | 'roomNo'>;
  size?: 'thumb' | 'hero';
  className?: string;
}

export default function MeetingRoomPhoto({
  room,
  size = 'thumb',
  className,
}: MeetingRoomPhotoProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className={[
        'mp-room-photo',
        `mp-room-photo--${size}`,
        loaded ? 'is-loaded' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {!loaded && !error && <div className="mp-room-photo-skeleton" aria-hidden />}
      {error ? (
        <div className="mp-room-photo-fallback">
          <span>{room.roomNo}</span>
          <small>室内全景</small>
        </div>
      ) : (
        <img
          src={room.photoUrl}
          alt={`${room.name} 室内全景照`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
