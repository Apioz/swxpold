import { useEffect, useState, type ReactNode } from 'react';
import { Descriptions, Modal, Tag } from 'antd';
import {
  ApiOutlined,
  CloudOutlined,
  ColumnHeightOutlined,
  DashboardOutlined,
  DesktopOutlined,
  ExperimentOutlined,
  LockOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { FacilityDeviceType, FlowMeterDevice } from '../../types/innovationCenter';
import { DEVICE_TYPE_COLUMN_LABELS } from '../../types/innovationCenter';
import { getFlowMeterRuntime } from '../../data/mockFlowMeterRuntime';
import './InnovationCenter.css';

interface FlowMeterDeviceDetailModalProps {
  device: FlowMeterDevice | null;
  open: boolean;
  onClose: () => void;
}

const statusTag = {
  online: { color: 'success', text: '在线' },
  offline: { color: 'default', text: '离线' },
  alarm: { color: 'error', text: '报警' },
} as const;

const typeIcons: Record<FacilityDeviceType, ReactNode> = {
  纯水流量计: <ExperimentOutlined />,
  压差计: <ColumnHeightOutlined />,
  电表: <ThunderboltOutlined />,
  温湿度传感器: <CloudOutlined />,
  氧浓度: <DashboardOutlined />,
  门禁: <LockOutlined />,
  摄像头: <VideoCameraOutlined />,
  会议屏: <DesktopOutlined />,
  门禁控制器: <ApiOutlined />,
};

export default function FlowMeterDeviceDetailModal({
  device,
  open,
  onClose,
}: FlowMeterDeviceDetailModalProps) {
  if (!device) return null;

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      centered
      destroyOnHidden
      className="flow-meter-detail-modal"
      styles={{ body: { padding: 0 } }}
    >
      <DeviceDetailContent device={device} />
    </Modal>
  );
}

function DeviceDetailContent({ device }: { device: FlowMeterDevice }) {
  const offline = device.status === 'offline';
  const alarm = device.status === 'alarm';
  const labels = DEVICE_TYPE_COLUMN_LABELS[device.deviceType];
  const [runtime, setRuntime] = useState(() => getFlowMeterRuntime(device));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setRuntime(getFlowMeterRuntime(device));
    const timer = setInterval(() => {
      setRuntime(getFlowMeterRuntime(device));
      setTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, [device]);

  const status = statusTag[device.status];

  return (
    <div className="flow-meter-detail-body">
      <div className="flow-meter-detail-header">
        <div className="flow-meter-detail-header-left">
          <div className={`flow-meter-detail-icon ${device.status}`}>
            {typeIcons[device.deviceType]}
          </div>
          <div>
            <h3>{device.name}</h3>
            <p>
              {device.code} · {device.deviceType} · 房间 {device.roomNo || '-'}
            </p>
          </div>
        </div>
        <div className="flow-meter-detail-live">
          <SyncOutlined spin={!offline} />
          <span>{runtime.updatedAt}</span>
          {tick > 0 && !offline && <Tag color="processing">实时</Tag>}
          <Tag color={status.color}>{status.text}</Tag>
        </div>
      </div>

      <div className="flow-meter-detail-info">
        <Descriptions size="small" column={2} bordered>
          <Descriptions.Item label="设备编号">{device.code}</Descriptions.Item>
          <Descriptions.Item label="房间号">{device.roomNo || '-'}</Descriptions.Item>
          <Descriptions.Item label={labels.name}>{device.name}</Descriptions.Item>
          <Descriptions.Item label="设备类型">{device.deviceType}</Descriptions.Item>
          {labels.ip && (
            <Descriptions.Item label={labels.ip}>{device.ip || '-'}</Descriptions.Item>
          )}
          {device.spec && (
            <Descriptions.Item label="规格">{device.spec}</Descriptions.Item>
          )}
          {device.mac && (
            <Descriptions.Item label="MAC地址">{device.mac}</Descriptions.Item>
          )}
          {device.gateway && (
            <Descriptions.Item label="网关">{device.gateway}</Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <div className="flow-meter-detail-readings">
        <div className="flow-meter-detail-readings-title">
          实时读数
          {alarm && <Tag color="warning">数值异常，请关注</Tag>}
        </div>
        <div className="flow-meter-reading-grid">
          {runtime.readings.map((item) => (
            <div
              key={item.key}
              className="flow-meter-reading-card"
              style={{ borderTopColor: item.accent ?? '#1890ff' }}
            >
              <div className="flow-meter-reading-label">{item.label}</div>
              <div
                className="flow-meter-reading-value"
                style={{ color: item.accent ?? (offline ? undefined : '#1890ff') }}
              >
                {item.value}
                {item.unit && <span className="flow-meter-reading-unit">{item.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
