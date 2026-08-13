import { DashboardOutlined } from '@ant-design/icons';
import floorPlanImage from '../../assets/floor-plan-5f-network.png';
import type { HailinDiagramNode, HailinPipeSegment } from '../../types/hailinMeter';
import {
  FLOOR_PLAN_5F_HEIGHT,
  FLOOR_PLAN_5F_WIDTH,
  floorPlan5FPipeJunctions,
} from '../../data/floorPlan5FNetworkLayout';
import '../../pages/innovation-center/InnovationCenter.css';
import './HailinMeter.css';

interface HailinNetworkCanvasProps {
  pipeSegments: HailinPipeSegment[];
  nodes: HailinDiagramNode[];
  selectedId: string;
  onNodeClick: (deviceId: string) => void;
}

function renderCadPipe(
  line: HailinPipeSegment,
  index: number,
  viewW: number,
  viewH: number,
) {
  const x1 = (line.x1 / 100) * viewW;
  const y1 = (line.y1 / 100) * viewH;
  const x2 = (line.x2 / 100) * viewW;
  const y2 = (line.y2 / 100) * viewH;
  const isMain = line.pipeType === 'main';

  if (isMain) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * 1.8;
    const ny = (dx / len) * 1.8;

    return (
      <g key={`pipe-${index}`} className="hailin-cad-pipe-group main">
        <line
          x1={x1 + nx}
          y1={y1 + ny}
          x2={x2 + nx}
          y2={y2 + ny}
          className="hailin-cad-pipe-edge"
        />
        <line
          x1={x1 - nx}
          y1={y1 - ny}
          x2={x2 - nx}
          y2={y2 - ny}
          className="hailin-cad-pipe-edge"
        />
        <line x1={x1} y1={y1} x2={x2} y2={y2} className="hailin-cad-pipe-center" />
      </g>
    );
  }

  return (
    <g key={`pipe-${index}`} className="hailin-cad-pipe-group branch">
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="hailin-network-pipe branch" />
    </g>
  );
}

export default function HailinNetworkCanvas({
  pipeSegments,
  nodes,
  selectedId,
  onNodeClick,
}: HailinNetworkCanvasProps) {
  const aspectRatio = `${FLOOR_PLAN_5F_WIDTH} / ${FLOOR_PLAN_5F_HEIGHT}`;

  return (
    <div className="floor-viewer-map hailin-network-floor-map has-image">
      <div
        className="hailin-network-plan-stage"
        style={{ aspectRatio }}
      >
        <img
          src={floorPlanImage}
          alt="5F 管网点位结构平面图"
          className="hailin-network-plan-image"
          draggable={false}
        />

        <svg
          className="hailin-network-pipe-svg hailin-network-pipe-svg--cad"
          viewBox={`0 0 ${FLOOR_PLAN_5F_WIDTH} ${FLOOR_PLAN_5F_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {pipeSegments.map((line, i) =>
            renderCadPipe(line, i, FLOOR_PLAN_5F_WIDTH, FLOOR_PLAN_5F_HEIGHT),
          )}

          {floorPlan5FPipeJunctions.map((j, i) => {
            const cx = (j.x / 100) * FLOOR_PLAN_5F_WIDTH;
            const cy = (j.y / 100) * FLOOR_PLAN_5F_HEIGHT;
            return (
              <g key={`junction-${i}`} className={`hailin-cad-junction ${j.type}`}>
                {j.type === 'inlet' && (
                  <>
                    <circle cx={cx} cy={cy} r={5} className="hailin-cad-inlet-ring" />
                    <text x={cx + 8} y={cy - 6} className="hailin-cad-pipe-label">
                      DN300
                    </text>
                  </>
                )}
                {j.type === 'tee' && <circle cx={cx} cy={cy} r={3.2} />}
                {j.type === 'elbow' && <rect x={cx - 2.5} y={cy - 2.5} width={5} height={5} />}
              </g>
            );
          })}
        </svg>

        {nodes.map((node) => (
          <div
            key={node.deviceId}
            className={`hailin-network-device-wrap${selectedId === node.deviceId ? ' is-selected' : ''}`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            onClick={() => onNodeClick(node.deviceId)}
          >
            {node.status === 'online' && <span className="floor-device-pulse" aria-hidden />}
            {node.status === 'alarm' && <span className="floor-device-alarm-ring" aria-hidden />}
            <div
              className={`floor-device-marker-dot ${node.status}${selectedId === node.deviceId ? ' selected' : ''}`}
              title={node.code}
            >
              <DashboardOutlined />
            </div>
            <div className="hailin-network-device-card">
              <div className="hailin-network-device-card-head">
                <span className="code">{node.code}</span>
                <span className={`badge ${node.status}`}>
                  {node.status === 'online' ? '在线' : node.status === 'alarm' ? '异常' : '离线'}
                </span>
              </div>
              <div className="name">{node.label}</div>
              <div className="flow">
                瞬时: {node.status === 'offline' ? '--' : `${node.instantFlow} m³/h`}
              </div>
              <div className="flow">累计: {node.cumulativeFlow} m³</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
