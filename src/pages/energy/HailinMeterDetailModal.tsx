import { useEffect, useState } from 'react';
import { Modal, Tag } from 'antd';
import { DashboardOutlined } from '@ant-design/icons';
import type { HailinMeterDevice } from '../../types/hailinMeter';
import { getHailinRuntimeDetailRows } from '../../config/hailinRuntimeFields';
import { getHailinRuntime } from '../../data/mockHailinMeters';
import './HailinMeter.css';

interface HailinMeterDetailModalProps {
  device: HailinMeterDevice | null;
  open: boolean;
  onClose: () => void;
}

export default function HailinMeterDetailModal({
  device,
  open,
  onClose,
}: HailinMeterDetailModalProps) {
  const [runtime, setRuntime] = useState(() =>
    device ? getHailinRuntime(device.id) : null,
  );

  useEffect(() => {
    if (!device) return;
    setRuntime(getHailinRuntime(device.id));
    const timer = setInterval(() => setRuntime(getHailinRuntime(device.id)), 3000);
    return () => clearInterval(timer);
  }, [device]);

  if (!device || !runtime) return null;

  const detailRows = getHailinRuntimeDetailRows(runtime);

  return (
    <Modal
      title={`能量计详情 — ${device.code}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnHidden
    >
      <div className="hailin-detail-modal-head">
        <div className="hailin-detail-modal-icon">
          <DashboardOutlined />
        </div>
        <div>
          <h3>{runtime.deviceName}</h3>
          <p>
            {runtime.room} ·{' '}
            <Tag color={runtime.status === 'online' ? 'success' : 'default'}>
              {runtime.statusText}
            </Tag>
          </p>
        </div>
      </div>

      <div className="hailin-detail-section">
        <h4>台账信息</h4>
        {[
          ['能量计编号', device.code],
          ['所属分区', device.zone],
          ['介质', device.medium],
          ['量程', device.rangeSpec],
          ['安装位置', device.installLocation],
          ['通讯方式', device.protocol],
        ].map(([label, value]) => (
          <div key={label} className="hailin-info-row">
            <span className="label">{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>

      <div className="hailin-detail-section">
        <h4>实时监测数据</h4>
        <div className="hailin-runtime-field-list">
          {detailRows.map((row) => (
            <div key={row.label} className="hailin-runtime-field-item">
              <span className="label">{row.label}</span>
              <span className="value">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
