import { useEffect, useState } from 'react';
import { Button, Modal } from 'antd';
import type { MeetingRoomPlanPoint } from '../../types/midPlatformMeetingRoom';
import FloorPlanPointEditor from './FloorPlanPointEditor';

interface FloorPlanPointModalProps {
  open: boolean;
  floorPlanUrl: string;
  building: string;
  floor: string;
  point: MeetingRoomPlanPoint | null;
  onCancel: () => void;
  onConfirm: (point: MeetingRoomPlanPoint | null) => void;
}

export default function FloorPlanPointModal({
  open,
  floorPlanUrl,
  building,
  floor,
  point,
  onCancel,
  onConfirm,
}: FloorPlanPointModalProps) {
  const [draftPoint, setDraftPoint] = useState<MeetingRoomPlanPoint | null>(point);

  useEffect(() => {
    if (open) setDraftPoint(point);
  }, [open, point]);

  return (
    <Modal
      title="设置点位"
      open={open}
      onCancel={onCancel}
      width={920}
      destroyOnHidden
      footer={
        <div className="meeting-room-modal-footer">
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={() => onConfirm(draftPoint)}>
            确定
          </Button>
        </div>
      }
      className="floor-plan-point-modal"
    >
      <FloorPlanPointEditor
        floorPlanUrl={floorPlanUrl}
        building={building}
        floor={floor}
        point={draftPoint}
        onChange={setDraftPoint}
      />
    </Modal>
  );
}
