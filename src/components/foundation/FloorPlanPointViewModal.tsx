import { Button, Modal } from 'antd';
import type { MeetingRoomPlanPoint } from '../../types/midPlatformMeetingRoom';
import FloorPlanPointEditor from './FloorPlanPointEditor';

interface FloorPlanPointViewModalProps {
  open: boolean;
  floorPlanUrl: string;
  building: string;
  floor: string;
  point: MeetingRoomPlanPoint | null;
  onClose: () => void;
}

export default function FloorPlanPointViewModal({
  open,
  floorPlanUrl,
  building,
  floor,
  point,
  onClose,
}: FloorPlanPointViewModalProps) {
  return (
    <Modal
      title="查看定位"
      open={open}
      onCancel={onClose}
      width={920}
      destroyOnHidden
      footer={
        <div className="meeting-room-modal-footer">
          <Button type="primary" onClick={onClose}>
            关闭
          </Button>
        </div>
      }
      className="floor-plan-point-modal floor-plan-point-view-modal"
    >
      <FloorPlanPointEditor
        floorPlanUrl={floorPlanUrl}
        building={building}
        floor={floor}
        point={point}
        readOnly
      />
    </Modal>
  );
}
