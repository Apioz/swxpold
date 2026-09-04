import { useState } from 'react';
import {
  AudioOutlined,
  BorderOutlined,
  DesktopOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { Button, Modal, Radio, Space, Tag } from 'antd';
import type {
  MeetingRoomEquipment,
  MidPlatformMeetingRoom,
} from '../../../../../types/midPlatformMeetingRoom';
import FloorPlanPointViewModal from '../../../../../components/foundation/FloorPlanPointViewModal';
import { getFloorPlan } from '../../../../../store/meetingRoomFloorPlanStore';
import { resolveMeetingRoomFloorContext } from '../../../../../utils/meetingRoomFloorContext';

interface MeetingRoomViewModalProps {
  open: boolean;
  record: MidPlatformMeetingRoom | null;
  onClose: () => void;
}

const equipmentIcons: Record<MeetingRoomEquipment, React.ReactNode> = {
  投影仪: <DesktopOutlined />,
  白板: <BorderOutlined />,
  麦克风: <AudioOutlined />,
};

function ViewField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mid-platform-meeting-view-field">
      <span className="mid-platform-meeting-view-label">{label}</span>
      <span className="mid-platform-meeting-view-value">{value}</span>
    </div>
  );
}

export default function MeetingRoomViewModal({
  open,
  record,
  onClose,
}: MeetingRoomViewModalProps) {
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  if (!record) return null;

  const floorCtx = resolveMeetingRoomFloorContext({
    building: record.building,
    spaceLocation: record.spaceLocation,
    address: record.address,
    cover: record.cover,
  });
  const floorPlan = floorCtx ? getFloorPlan(floorCtx.building, floorCtx.floor) : undefined;

  return (
    <>
      <Modal
        title="查看"
        open={open}
        onCancel={onClose}
        width={880}
        destroyOnHidden
        footer={null}
        className="mid-platform-meeting-room-modal mid-platform-meeting-view-modal"
      >
        <div className="meeting-room-view-sections">
          <section className="meeting-room-form-section">
            <div className="meeting-room-form-section-title">基本信息</div>
            <div className="mid-platform-meeting-view-grid">
              <div className="meeting-room-view-grid">
                <ViewField label="空间位置" value={record.spaceLocation} />
                <ViewField label="地址" value={record.address} />
                <ViewField label="会议室编号" value={record.roomNo} />
                <ViewField label="会议室名称" value={record.name} />
                <ViewField label="面积" value={`${record.area} m²`} />
                <ViewField label="容纳人数" value={`${record.capacity} 人`} />
              </div>
            </div>
          </section>

          <section className="meeting-room-form-section">
            <div className="meeting-room-form-section-title">封面与点位</div>

            <div className="meeting-room-media-row">
              {record.cover ? (
                <div className="meeting-room-form-subsection">
                  <div className="meeting-room-form-subsection-label">会议室全景图</div>
                  <div className="meeting-room-cover-panel has-cover meeting-room-media-panel">
                    <div className="meeting-room-cover-panel-media">
                      <img src={record.cover.imageUrl} alt={record.cover.imageName} />
                    </div>
                    <div className="meeting-room-cover-panel-body">
                      <div className="meeting-room-cover-panel-name">{record.cover.imageName}</div>
                      <div className="meeting-room-cover-panel-path">{record.cover.documentPath}</div>
                      <div className="meeting-room-cover-panel-meta">
                        {record.cover.building} · {record.cover.floor}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="meeting-room-form-subsection">
                  <div className="meeting-room-form-subsection-label">会议室全景图</div>
                  <div className="meeting-room-floor-plan-empty meeting-room-media-panel">
                    未上传封面（可选）
                  </div>
                </div>
              )}

              <div className="meeting-room-form-subsection">
                <div className="meeting-room-form-subsection-label">
                  楼层平面图
                  {floorCtx && (
                    <span className="meeting-room-form-subsection-meta">
                      {floorCtx.building} · {floorCtx.floor}
                    </span>
                  )}
                </div>
                {floorPlan ? (
                  <div className="meeting-room-floor-plan-panel has-plan meeting-room-media-panel">
                    <div className="meeting-room-floor-plan-preview">
                      <img src={floorPlan.imageUrl} alt={floorPlan.imageName} />
                    </div>
                    <div className="meeting-room-floor-plan-body">
                      <div className="meeting-room-cover-panel-name">{floorPlan.imageName}</div>
                      <div className="meeting-room-cover-panel-actions">
                        <Button
                          icon={<EnvironmentOutlined />}
                          onClick={() => setLocationModalOpen(true)}
                        >
                          查看定位
                        </Button>
                        <Tag color={record.planPoint ? 'success' : 'default'}>
                          {record.planPoint ? '已设置点位' : '未设置点位'}
                        </Tag>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="meeting-room-floor-plan-empty meeting-room-media-panel">
                    该楼层尚未上传平面图
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="meeting-room-form-section">
            <div className="meeting-room-form-section-title">预约配置</div>
            <div className="mid-platform-meeting-view-grid meeting-room-view-config">
              <ViewField
                label="状态"
                value={
                  <Radio.Group value={record.status} disabled>
                    <Radio value="disabled">禁用</Radio>
                    <Radio value="enabled">启用</Radio>
                    <Radio value="idle">空闲</Radio>
                  </Radio.Group>
                }
              />
              {record.status === 'idle' && (
                <div className="meeting-room-idle-notice full-width">
                  <Tag color="success" className="meeting-room-idle-tag">
                    空闲
                  </Tag>
                  <span className="meeting-room-idle-desc">
                    空闲状态下不限制人员进出，任何人都可通过扫脸开启使用
                  </span>
                </div>
              )}
              <ViewField
                label="使用权限"
                value={
                  <Radio.Group value={record.usagePermission} disabled>
                    <Radio value="unlimited">不限</Radio>
                    <Radio value="restricted">限制人群使用</Radio>
                  </Radio.Group>
                }
              />
              <ViewField
                label="设备"
                value={
                  record.equipment.length > 0 ? (
                    <Space wrap>
                      {record.equipment.map((item) => (
                        <Tag key={item} className="mid-platform-equipment-display-tag">
                          {equipmentIcons[item]} {item}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    '-'
                  )
                }
              />
              <ViewField
                label="预约屏设备"
                value={
                  record.screenDevice ? (
                    <Tag className="mid-platform-screen-device-tag">{record.screenDevice}</Tag>
                  ) : (
                    '-'
                  )
                }
              />
              <ViewField label="描述" value={record.description?.trim() ? record.description : '-'} />
            </div>
          </section>
        </div>
      </Modal>

      {floorPlan && floorCtx && (
        <FloorPlanPointViewModal
          open={locationModalOpen}
          floorPlanUrl={floorPlan.imageUrl}
          building={floorCtx.building}
          floor={floorCtx.floor}
          point={record.planPoint ?? null}
          onClose={() => setLocationModalOpen(false)}
        />
      )}
    </>
  );
}
