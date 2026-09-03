import { useEffect, useState } from 'react';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Modal, Radio, Space, message } from 'antd';
import type { MeetingRoomUsagePermission } from '../../../../../types/midPlatformMeetingRoom';
import MeetingRoomAuthorizedUsersPicker from './MeetingRoomAuthorizedUsersPicker';

export interface MeetingRoomPermissionResult {
  usagePermission: MeetingRoomUsagePermission;
  authorizedUserIds: string[];
}

interface MeetingRoomPermissionModalProps {
  open: boolean;
  initialUsagePermission?: MeetingRoomUsagePermission;
  initialAuthorizedUserIds?: string[];
  onCancel: () => void;
  onConfirm: (result: MeetingRoomPermissionResult) => void;
}

export default function MeetingRoomPermissionModal({
  open,
  initialUsagePermission = 'restricted',
  initialAuthorizedUserIds = [],
  onCancel,
  onConfirm,
}: MeetingRoomPermissionModalProps) {
  const [usagePermission, setUsagePermission] =
    useState<MeetingRoomUsagePermission>(initialUsagePermission);
  const [authorizedUserIds, setAuthorizedUserIds] = useState<string[]>(initialAuthorizedUserIds);

  useEffect(() => {
    if (!open) return;
    setUsagePermission(initialUsagePermission);
    setAuthorizedUserIds(initialAuthorizedUserIds);
  }, [open, initialUsagePermission, initialAuthorizedUserIds]);

  const handleSubmit = () => {
    if (usagePermission === 'restricted' && authorizedUserIds.length === 0) {
      message.warning('限制人群使用时，请至少选择一名授权用户');
      return;
    }
    onConfirm({
      usagePermission,
      authorizedUserIds: usagePermission === 'restricted' ? authorizedUserIds : [],
    });
  };

  return (
    <Modal
      title="设置使用权限"
      open={open}
      onCancel={onCancel}
      width={720}
      destroyOnHidden
      footer={
        <Space>
          <Button type="primary" icon={<CheckOutlined />} onClick={handleSubmit}>
            提交
          </Button>
          <Button icon={<CloseOutlined />} onClick={onCancel}>
            取消
          </Button>
        </Space>
      }
      className="mid-platform-meeting-room-modal"
    >
      <div className="mid-platform-permission-form">
        <div className="mid-platform-permission-row">
          <span className="mid-platform-permission-label">使用权限</span>
          <Radio.Group
            value={usagePermission}
            onChange={(e) => {
              const next = e.target.value as MeetingRoomUsagePermission;
              setUsagePermission(next);
              if (next === 'unlimited') setAuthorizedUserIds([]);
            }}
          >
            <Radio value="unlimited">不限</Radio>
            <Radio value="restricted">限制人群使用</Radio>
          </Radio.Group>
        </div>
        {usagePermission === 'restricted' && (
          <div className="mid-platform-permission-row mid-platform-permission-users">
            <span className="mid-platform-permission-label">授权用户</span>
            <MeetingRoomAuthorizedUsersPicker
              value={authorizedUserIds}
              onChange={setAuthorizedUserIds}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
