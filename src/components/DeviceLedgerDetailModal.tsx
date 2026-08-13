import { Descriptions, Modal, Tag } from 'antd';
import type { FlowMeterDevice } from '../types/innovationCenter';
import '../pages/innovation-center/InnovationCenter.css';
import '../pages/security/SecurityPages.css';

interface DeviceLedgerDetailModalProps {
  device: FlowMeterDevice | null;
  open: boolean;
  onClose: () => void;
}

const monitorStatusMap = {
  online: { color: 'success', text: '在线' },
  offline: { color: 'default', text: '离线' },
  alarm: { color: 'error', text: '报警' },
} as const;

function field(value?: string) {
  return value?.trim() ? value : '-';
}

export default function DeviceLedgerDetailModal({
  device,
  open,
  onClose,
}: DeviceLedgerDetailModalProps) {
  if (!device) return null;

  const status = monitorStatusMap[device.status];

  return (
    <Modal
      title="查看详情"
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      centered
      destroyOnHidden
      className="access-device-detail-modal"
    >
      <div className="access-device-detail-section">
        <h4 className="access-device-detail-section-title">台账基本信息</h4>
        <Descriptions bordered size="small" column={3} className="access-device-detail-grid">
          <Descriptions.Item label="安装位置">
            {field(device.installLocation || device.roomNo)}
          </Descriptions.Item>
          <Descriptions.Item label="设备类型">{device.deviceType}</Descriptions.Item>
          <Descriptions.Item label="对接地址">
            {field(device.integrationAddress)}
          </Descriptions.Item>
          <Descriptions.Item label="设备名称">{device.name}</Descriptions.Item>
          <Descriptions.Item label="设备编号">{device.code}</Descriptions.Item>
          <Descriptions.Item label="序列号/SN">
            {field(device.serialNo || device.code)}
          </Descriptions.Item>
          <Descriptions.Item label="通道号">{field(device.channelNo)}</Descriptions.Item>
          <Descriptions.Item label="IP地址">{field(device.ip)}</Descriptions.Item>
          <Descriptions.Item label="绑定状态">{field(device.bindingStatus)}</Descriptions.Item>
          <Descriptions.Item label="品牌">{field(device.brand)}</Descriptions.Item>
          <Descriptions.Item label="型号">
            {field(device.model || device.spec)}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <div className="access-device-detail-section">
        <h4 className="access-device-detail-section-title">平台编辑信息</h4>
        <Descriptions bordered size="small" column={3} className="access-device-detail-grid">
          <Descriptions.Item label="账号">{field(device.account)}</Descriptions.Item>
          <Descriptions.Item label="密码">{field(device.password)}</Descriptions.Item>
          <Descriptions.Item label="监测状态">
            <Tag color={status.color}>{status.text}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Modal>
  );
}
