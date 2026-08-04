import { useEffect, useState } from 'react';
import { Modal, Tag } from 'antd';
import {
  CloudOutlined,
  FireOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { HvacSystemRuntime, PlcHvacSystem } from '../../types/innovationCenter';
import { getHvacSystemRuntime } from '../../data/mockHvacRuntime';
import './PlcHvac.css';

interface HvacSystemRuntimeModalProps {
  system: PlcHvacSystem | null;
  open: boolean;
  onClose: () => void;
}

const statusTag = {
  online: { color: 'success', text: '正常' },
  offline: { color: 'default', text: '离线' },
  alarm: { color: 'error', text: '异常' },
} as const;

export default function HvacSystemRuntimeModal({
  system,
  open,
  onClose,
}: HvacSystemRuntimeModalProps) {
  if (!system) return null;

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={1080}
      centered
      destroyOnHidden
      className="hvac-runtime-modal"
      styles={{ body: { padding: 0 } }}
    >
      <HvacRuntimeContent system={system} />
    </Modal>
  );
}

function HvacRuntimeContent({ system }: { system: PlcHvacSystem }) {
  const offline = system.status === 'offline';
  const [runtime, setRuntime] = useState<HvacSystemRuntime | null>(() =>
    getHvacSystemRuntime(system.id, offline),
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setRuntime(getHvacSystemRuntime(system.id, offline));
    const timer = setInterval(() => {
      setRuntime(getHvacSystemRuntime(system.id, offline));
      setTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, [system.id, offline]);

  if (!runtime) {
    return <div className="hvac-runtime-empty">暂无运行图数据</div>;
  }

  return (
    <div className="hvac-runtime-panel hvac-runtime-modal-body">
      <div className="hvac-modal-header">
        <div className="hvac-modal-header-left">
          <div className="hvac-modal-icon">
            <ThunderboltOutlined />
          </div>
          <div>
            <h3>{system.systemName}</h3>
            <p>
              {system.systemCode} · 管控 {runtime.rooms.length} 个房间 · {system.screenName}
            </p>
          </div>
        </div>
        <div className="hvac-runtime-live">
          <SyncOutlined spin={!offline} />
          <span>{runtime.updatedAt}</span>
          {tick > 0 && <Tag color="processing">实时</Tag>}
          <Tag color={offline ? 'default' : 'success'}>{offline ? '已停机' : '运行中'}</Tag>
        </div>
      </div>

      <div className="hvac-system-metrics">
        <MetricCard label="送风温度" value={runtime.supplyAirTemp} unit="℃" icon="temp" offline={offline} accent="#1890ff" />
        <MetricCard label="回风温度" value={runtime.returnAirTemp} unit="℃" icon="temp" offline={offline} accent="#fa8c16" />
        <MetricCard label="送风湿度" value={runtime.supplyAirHumidity} unit="%RH" icon="humid" offline={offline} accent="#13c2c2" />
        <MetricCard label="风机频率" value={runtime.fanFrequency} unit="Hz" icon="fan" offline={offline} accent="#722ed1" />
        <MetricCard label="水阀开度" value={runtime.valveOpening} unit="%" offline={offline} accent="#52c41a" />
        <MetricCard label="风量" value={runtime.airVolume} unit="m³/h" offline={offline} accent="#2f54eb" />
        <MetricCard label="滤网压差" value={runtime.filterPressure} unit="Pa" offline={offline} accent="#eb2f96" />
      </div>

      <div className="hvac-schematic">
        {/* 送风管道 */}
        <div className="hvac-duct-row supply">
          <div className="hvac-duct-label">
            <span className="duct-badge supply">送风</span>
            送风总管
          </div>
          <div className="hvac-duct-pipe supply">
            <div className={`hvac-air-flow supply${offline ? ' stopped' : ''}`} />
            <span className="duct-reading">
              {offline ? '--' : `${runtime.supplyAirTemp}℃ · ${runtime.supplyAirHumidity}%RH`}
            </span>
          </div>
        </div>

        {/* 主体运行图 */}
        <div className="hvac-schematic-body">
          <svg className="hvac-pipe-svg" viewBox="0 0 1000 400" preserveAspectRatio="none">
            <defs>
              <linearGradient id="supplyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#69b1ff" />
                <stop offset="100%" stopColor="#1890ff" />
              </linearGradient>
              <linearGradient id="returnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffc069" />
                <stop offset="100%" stopColor="#fa8c16" />
              </linearGradient>
            </defs>
            {/* 主干送风竖管 */}
            <rect x="488" y="0" width="24" height="60" rx="4" fill="url(#supplyGrad)" opacity="0.85" />
            {/* 主干回风竖管 */}
            <rect x="488" y="340" width="24" height="60" rx="4" fill="url(#returnGrad)" opacity="0.85" />
            {/* 房间连接支管 */}
            {runtime.rooms.map((room, i) => {
              const cx = (room.x + room.width / 2) * 10;
              const top = room.y * 4 + 20;
              return (
                <g key={room.roomNo}>
                  <line x1="500" y1="60" x2={cx} y2={top} stroke="#91caff" strokeWidth="3" strokeDasharray="6 4" opacity="0.6" />
                  <line x1="500" y1="340" x2={cx} y2={top + room.height * 4} stroke="#ffc069" strokeWidth="3" strokeDasharray="6 4" opacity="0.5" />
                  {!offline && (
                    <circle r="4" fill="#1890ff" opacity="0.8">
                      <animateMotion dur={`${2 + i * 0.3}s`} repeatCount="indefinite" path={`M500,60 L${cx},${top}`} />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="hvac-diagram-map">
            {runtime.rooms.map((room) => (
              <div
                key={room.roomNo}
                className={`hvac-room-schematic ${room.status}`}
                style={{
                  left: `${room.x}%`,
                  top: `${room.y}%`,
                  width: `${room.width}%`,
                  height: `${room.height}%`,
                }}
              >
                <div className="hvac-room-schematic-inner">
                  <div className="hvac-room-top">
                    <span className="hvac-room-no">{room.roomNo}</span>
                    <Tag color={statusTag[room.status].color} className="hvac-room-tag">
                      {statusTag[room.status].text}
                    </Tag>
                  </div>
                  <div className="hvac-room-name">{room.roomName}</div>
                  <div className="hvac-room-gauges">
                    <GaugeItem icon="temp" label="温度" value={room.temperature} unit="℃" offline={offline} />
                    <GaugeItem icon="humid" label="湿度" value={room.humidity} unit="%" offline={offline} />
                    <GaugeItem icon="pressure" label="压差" value={room.pressure} unit="Pa" offline={offline} />
                    <GaugeItem icon="co2" label="CO₂" value={room.co2} unit="ppm" offline={offline} />
                  </div>
                </div>
                <div className="hvac-room-connector top" />
                <div className="hvac-room-connector bottom" />
              </div>
            ))}

            {/* AHU 机组 */}
            <div className={`hvac-ahu-schematic${offline ? ' offline' : ''}`}>
              <div className={`hvac-ahu-fan${offline ? '' : ' spinning'}`}>
                <svg viewBox="0 0 64 64" width="56" height="56">
                  <circle cx="32" cy="32" r="28" fill="#1890ff" opacity="0.15" />
                  <circle cx="32" cy="32" r="22" fill="none" stroke="#1890ff" strokeWidth="2" />
                  {[0, 72, 144, 216, 288].map((deg) => (
                    <line
                      key={deg}
                      x1="32" y1="32"
                      x2={32 + 20 * Math.cos((deg * Math.PI) / 180)}
                      y2={32 + 20 * Math.sin((deg * Math.PI) / 180)}
                      stroke="#1890ff" strokeWidth="4" strokeLinecap="round"
                    />
                  ))}
                  <circle cx="32" cy="32" r="5" fill="#1890ff" />
                </svg>
              </div>
              <div className="hvac-ahu-info">
                <strong>AHU 空气处理机组</strong>
                <span>{system.screenName}</span>
                {!offline && (
                  <span className="ahu-freq">{runtime.fanFrequency} Hz</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 回风管道 */}
        <div className="hvac-duct-row return">
          <div className="hvac-duct-label">
            <span className="duct-badge return">回风</span>
            回风总管
          </div>
          <div className="hvac-duct-pipe return">
            <div className={`hvac-air-flow return${offline ? ' stopped' : ''}`} />
            <span className="duct-reading">
              {offline ? '--' : `${runtime.returnAirTemp}℃`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  icon,
  offline,
  accent = '#1890ff',
}: {
  label: string;
  value: number;
  unit: string;
  icon?: string;
  offline: boolean;
  accent?: string;
}) {
  const iconChar =
    icon === 'temp' ? '🌡' : icon === 'humid' ? '💧' : icon === 'fan' ? '🌀' : null;

  return (
    <div className="hvac-metric-card" style={{ borderTopColor: accent }}>
      <div className="hvac-metric-label">
        {iconChar && <span className="hvac-metric-icon">{iconChar}</span>}
        {label}
      </div>
      <div className="hvac-metric-value" style={{ color: accent }}>
        {offline ? '--' : value}
        {!offline && <span className="hvac-metric-unit">{unit}</span>}
      </div>
    </div>
  );
}

function GaugeItem({
  icon,
  label,
  value,
  unit,
  offline,
}: {
  icon: string;
  label: string;
  value: number;
  unit: string;
  offline: boolean;
}) {
  const icons: Record<string, React.ReactNode> = {
    temp: <FireOutlined />,
    humid: <CloudOutlined />,
    pressure: <span className="gauge-mini">Pa</span>,
    co2: <span className="gauge-mini">CO₂</span>,
  };

  return (
    <div className="hvac-gauge-item">
      <div className="gauge-icon">{icons[icon]}</div>
      <div className="gauge-data">
        <span className="gauge-label">{label}</span>
        <span className="gauge-value">{offline ? '--' : `${value}${unit}`}</span>
      </div>
    </div>
  );
}
