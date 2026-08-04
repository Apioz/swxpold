import type { FloorPlanDetail } from '../../types/innovationCenter';
import type { FlowMeterDevice } from '../../types/innovationCenter';
import type { ReactNode } from 'react';

type RoomType = 'corridor' | 'utility' | 'lab' | 'zone';

interface FloorPlanCanvasProps {
  floor: FloorPlanDetail;
  hasImage: boolean;
  mapBackgroundStyle?: React.CSSProperties;
  mapDevices: Array<FlowMeterDevice & { isCustomPoint?: boolean }>;
  selectedDeviceId: string | null;
  placingMode: boolean;
  pendingPosition: { mapX: number; mapY: number } | null;
  onMapClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDeviceClick: (deviceId: string, e: React.MouseEvent) => void;
  deviceIcon: (type: FlowMeterDevice['deviceType']) => ReactNode;
  mapInnerRef: React.RefObject<HTMLDivElement | null>;
}

function getRoomType(room: FloorPlanDetail['rooms'][number]): RoomType {
  if (room.id.includes('corridor') || room.label.includes('走廊')) return 'corridor';
  if (
    room.label.includes('水井') ||
    room.label.includes('机房') ||
    room.label.includes('配电') ||
    room.label.includes('AP')
  ) {
    return 'utility';
  }
  if (/^\d{3,4}$/.test(room.label)) return 'lab';
  return 'zone';
}

const labVariants = ['a', 'b', 'c', 'd', 'e'] as const;

export default function FloorPlanCanvas({
  floor,
  hasImage,
  mapBackgroundStyle,
  mapDevices,
  selectedDeviceId,
  placingMode,
  pendingPosition,
  onMapClick,
  onDeviceClick,
  deviceIcon,
  mapInnerRef,
}: FloorPlanCanvasProps) {
  let labIndex = 0;

  return (
    <div className={`floor-viewer-map${hasImage ? ' has-image' : ''}${placingMode ? ' placing-mode' : ''}`}>
      {!hasImage && (
        <>
          <div className="floor-viewer-map-grid" aria-hidden />
          <div className="floor-plan-paper-vignette" aria-hidden />
        </>
      )}
      <div
        ref={mapInnerRef}
        className={`floor-viewer-map-inner${hasImage ? '' : ' floor-plan-architectural'}`}
        style={mapBackgroundStyle}
        onClick={onMapClick}
      >
        {!hasImage && (
          <>
            <svg className="floor-plan-svg-deco" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <rect
                x="2.5"
                y="2.5"
                width="95"
                height="95"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.35"
                rx="0.8"
              />
              <rect
                x="4.5"
                y="4.5"
                width="91"
                height="91"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.12"
                strokeDasharray="1.2 0.8"
                opacity="0.5"
              />
            </svg>

            <div className="floor-plan-title-block">
              <div className="floor-plan-title-block-name">{floor.buildingName}</div>
              <div className="floor-plan-title-block-floor">{floor.floorLabel} · 平面图</div>
              <div className="floor-plan-title-block-scale">比例 1:200</div>
            </div>

            <div className="floor-plan-compass" aria-hidden>
              <span className="floor-plan-compass-n">N</span>
              <span className="floor-plan-compass-arrow" />
            </div>

            <div className="floor-plan-scale-bar" aria-hidden>
              <span className="floor-plan-scale-line" />
              <span>10m</span>
            </div>
          </>
        )}

        {!hasImage &&
          floor.rooms.map((room) => {
            const roomType = getRoomType(room);
            const variant =
              roomType === 'lab' ? labVariants[labIndex++ % labVariants.length] : undefined;

            return (
              <div
                key={room.id}
                className={[
                  'floor-room',
                  `floor-room--${roomType}`,
                  variant ? `floor-room--lab-${variant}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  left: `${room.x}%`,
                  top: `${room.y}%`,
                  width: `${room.width}%`,
                  height: `${room.height}%`,
                }}
              >
                <span className="floor-room-wall floor-room-wall--top" />
                <span className="floor-room-wall floor-room-wall--right" />
                <span className="floor-room-fill" />
                {roomType === 'corridor' && <span className="floor-room-corridor-line" />}
                {roomType === 'lab' && <span className="floor-room-door" />}
                <span className="floor-room-label">{room.label}</span>
                {roomType === 'lab' && <span className="floor-room-tag">实验室</span>}
                {roomType === 'utility' && <span className="floor-room-tag">设备</span>}
              </div>
            );
          })}

        {mapDevices.map((device) => (
          <div
            key={device.id}
            className={`floor-device-marker${selectedDeviceId === device.id ? ' is-selected' : ''}`}
            style={{ left: `${device.mapX}%`, top: `${device.mapY}%` }}
            onClick={(e) => onDeviceClick(device.id, e)}
          >
            {device.status === 'online' && <span className="floor-device-pulse" aria-hidden />}
            {device.status === 'alarm' && <span className="floor-device-alarm-ring" aria-hidden />}
            <div
              className={`floor-device-marker-dot ${device.status}${selectedDeviceId === device.id ? ' selected' : ''}${device.isCustomPoint ? ' custom' : ''}`}
              title={device.name}
            >
              {deviceIcon(device.deviceType)}
            </div>
            <span className="floor-device-marker-label">{device.roomNo || device.code}</span>
          </div>
        ))}

        {pendingPosition && placingMode && (
          <div
            className="floor-pending-marker"
            style={{ left: `${pendingPosition.mapX}%`, top: `${pendingPosition.mapY}%` }}
          />
        )}
      </div>
    </div>
  );
}
