import { useEffect, useState } from 'react';
import { Tooltip } from 'antd';
import { DashboardOutlined } from '@ant-design/icons';
import type { FlowMeterDevice } from '../../types/innovationCenter';
import {
  formatReadingDisplay,
  getFlowMeterRuntime,
} from '../../data/mockFlowMeterRuntime';
import './InnovationCenter.css';

interface FlowMeterMeterActionProps {
  device: FlowMeterDevice;
  onOpen: () => void;
}

export default function FlowMeterMeterAction({ device, onOpen }: FlowMeterMeterActionProps) {
  const [runtime, setRuntime] = useState(() => getFlowMeterRuntime(device));

  useEffect(() => {
    setRuntime(getFlowMeterRuntime(device));
    const timer = setInterval(() => setRuntime(getFlowMeterRuntime(device)), 3000);
    return () => clearInterval(timer);
  }, [device]);

  const tooltipContent = (
    <div className="flow-meter-gauge-tooltip">
      <div className="flow-meter-gauge-tooltip-title">仪表数据</div>
      {runtime.readings.map((item) => (
        <div key={item.key} className="flow-meter-gauge-tooltip-row">
          <span>{item.label}</span>
          <span>{formatReadingDisplay(item)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Tooltip title={tooltipContent} placement="top" color="#262626">
      <button
        type="button"
        className="flow-meter-gauge-btn"
        aria-label="仪表数据"
        onClick={onOpen}
      >
        <DashboardOutlined />
      </button>
    </Tooltip>
  );
}
