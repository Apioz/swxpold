import { useEffect, useState } from 'react';
import { EnvironmentOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import type { MeetingRoomPlanPoint } from '../../types/midPlatformMeetingRoom';

interface FloorPlanPointEditorProps {
  floorPlanUrl: string;
  building: string;
  floor: string;
  point: MeetingRoomPlanPoint | null;
  onChange?: (point: MeetingRoomPlanPoint | null) => void;
  readOnly?: boolean;
}

export default function FloorPlanPointEditor({
  floorPlanUrl,
  building,
  floor,
  point,
  onChange,
  readOnly = false,
}: FloorPlanPointEditorProps) {
  const [adding, setAdding] = useState(false);
  const hasPoint = point !== null;

  useEffect(() => {
    if (hasPoint) setAdding(false);
  }, [hasPoint]);

  const handleStartAdding = () => {
    if (hasPoint) return;
    setAdding(true);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !adding || hasPoint) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    onChange?.({
      x: Math.min(100, Math.max(0, Number(x.toFixed(2)))),
      y: Math.min(100, Math.max(0, Number(y.toFixed(2)))),
    });
    setAdding(false);
  };

  const handleClear = () => {
    onChange?.(null);
    setAdding(false);
  };

  return (
    <div className="floor-plan-point-editor">
      {!readOnly && (
        <div className="floor-plan-point-toolbar">
          <Space>
            <Button
              type={adding ? 'primary' : 'default'}
              icon={<PlusOutlined />}
              disabled={hasPoint}
              onClick={handleStartAdding}
            >
              增加点位
            </Button>
            {hasPoint && <Button onClick={handleClear}>清除点位</Button>}
          </Space>
          <span className="floor-plan-point-hint">
            <EnvironmentOutlined /> {building} {floor} 平面图
            {hasPoint
              ? ' · 每个会议室仅可设置 1 个点位，如需调整请先清除'
              : adding
                ? ' · 请在平面图上点击放置会议室点位'
                : ' · 每个会议室仅可设置 1 个点位'}
          </span>
        </div>
      )}
      {readOnly && (
        <div className="floor-plan-point-toolbar is-readonly">
          <span className="floor-plan-point-hint">
            <EnvironmentOutlined /> {building} {floor} 平面图
            {hasPoint ? ' · 会议室定位点位' : ' · 暂未设置定位点位'}
          </span>
        </div>
      )}
      <div
        className={`floor-plan-point-canvas${readOnly || !adding || hasPoint ? ' is-idle' : ''}`}
        onClick={handleCanvasClick}
        role="presentation"
      >
        <img src={floorPlanUrl} alt={`${building} ${floor} 平面图`} draggable={false} />
        {point && (
          <span
            className="floor-plan-point-marker"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          />
        )}
      </div>
    </div>
  );
}
