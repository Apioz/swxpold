import type { HailinDiagramNode, HailinPipeSegment } from '../types/hailinMeter';

/** 5F 平面图原始尺寸（与 assets/floor-plan-5f-network.png 一致） */
export const FLOOR_PLAN_5F_WIDTH = 1024;
export const FLOOR_PLAN_5F_HEIGHT = 461;

/**
 * 沿图纸「走廊」走向布置的管网（坐标系 0–100，与平面图百分比定位一致）
 * 总管：配电间 → 中央走廊 → 环绕中庭
 * 支路：由走廊向各房间竖向分支
 */
export const floorPlan5FPipeSegments: HailinPipeSegment[] = [
  // 总管：配电间出水 → 中央走廊
  { x1: 15.5, y1: 30, x2: 15.5, y2: 47.5, pipeType: 'main' },
  { x1: 15.5, y1: 47.5, x2: 87, y2: 47.5, pipeType: 'main' },

  // 上环支管（北走廊）
  { x1: 15.5, y1: 47.5, x2: 15.5, y2: 37.5, pipeType: 'branch' },
  { x1: 15.5, y1: 37.5, x2: 83, y2: 37.5, pipeType: 'branch' },
  { x1: 83, y1: 37.5, x2: 83, y2: 47.5, pipeType: 'branch' },

  // 下环支管（南走廊）
  { x1: 15.5, y1: 47.5, x2: 15.5, y2: 61.5, pipeType: 'branch' },
  { x1: 15.5, y1: 61.5, x2: 84, y2: 61.5, pipeType: 'branch' },
  { x1: 84, y1: 61.5, x2: 84, y2: 47.5, pipeType: 'branch' },

  // 北侧房间分支
  { x1: 22, y1: 37.5, x2: 22, y2: 24, pipeType: 'branch' },
  { x1: 34, y1: 37.5, x2: 34, y2: 24, pipeType: 'branch' },
  { x1: 48, y1: 37.5, x2: 48, y2: 24, pipeType: 'branch' },
  { x1: 62, y1: 37.5, x2: 62, y2: 24, pipeType: 'branch' },
  { x1: 74, y1: 37.5, x2: 74, y2: 24, pipeType: 'branch' },

  // 南侧房间分支
  { x1: 17, y1: 61.5, x2: 17, y2: 78, pipeType: 'branch' },
  { x1: 27, y1: 61.5, x2: 27, y2: 78, pipeType: 'branch' },
  { x1: 39, y1: 61.5, x2: 39, y2: 78, pipeType: 'branch' },
  { x1: 52, y1: 61.5, x2: 52, y2: 78, pipeType: 'branch' },
  { x1: 65, y1: 61.5, x2: 65, y2: 78, pipeType: 'branch' },
  { x1: 77, y1: 61.5, x2: 77, y2: 78, pipeType: 'branch' },

  // 右侧前室竖向接驳
  { x1: 87, y1: 47.5, x2: 87, y2: 37.5, pipeType: 'branch' },
  { x1: 87, y1: 47.5, x2: 87, y2: 61.5, pipeType: 'branch' },
];

/** 流量计点位（对齐图纸房间/走廊位置） */
export const floorPlan5FDiagramNodes: HailinDiagramNode[] = [
  {
    deviceId: 'hailin-W001',
    code: 'W001',
    label: '厂区总进水',
    subLabel: '配电间',
    x: 15.5,
    y: 34,
    status: 'online',
    instantFlow: 216,
    cumulativeFlow: 1285,
    nodeType: 'main',
  },
  {
    deviceId: 'hailin-W002',
    code: 'W002',
    label: '5204 生产支路',
    subLabel: 'W002',
    x: 39,
    y: 68,
    status: 'online',
    instantFlow: 78.5,
    cumulativeFlow: 456,
    nodeType: 'branch',
  },
  {
    deviceId: 'hailin-W007',
    code: 'W007',
    label: '5201 末端',
    subLabel: 'W007',
    x: 17,
    y: 76,
    status: 'online',
    instantFlow: 65.3,
    cumulativeFlow: 389,
    nodeType: 'terminal',
  },
  {
    deviceId: 'hailin-W003',
    code: 'W003',
    label: '5216 生活用水',
    subLabel: 'W003',
    x: 48,
    y: 47.5,
    status: 'online',
    instantFlow: 52.1,
    cumulativeFlow: 312,
    nodeType: 'branch',
  },
  {
    deviceId: 'hailin-W004',
    code: 'W004',
    label: '5205 厨房机房',
    subLabel: 'W004',
    x: 52,
    y: 68,
    status: 'offline',
    instantFlow: 0,
    cumulativeFlow: 128.4,
    nodeType: 'terminal',
  },
  {
    deviceId: 'hailin-W005',
    code: 'W005',
    label: '5210 绿化用水',
    subLabel: 'W005',
    x: 74,
    y: 42,
    status: 'online',
    instantFlow: 28.6,
    cumulativeFlow: 186,
    nodeType: 'branch',
  },
  {
    deviceId: 'hailin-W006',
    code: 'W006',
    label: '5207 外排监测',
    subLabel: 'W006',
    x: 84,
    y: 58,
    status: 'online',
    instantFlow: 35.2,
    cumulativeFlow: 242,
    nodeType: 'terminal',
  },
];

/** 管网三通/弯头节点（CAD 标注点） */
export const floorPlan5FPipeJunctions: { x: number; y: number; type: 'tee' | 'elbow' | 'inlet' }[] = [
  { x: 15.5, y: 47.5, type: 'tee' },
  { x: 83, y: 47.5, type: 'tee' },
  { x: 84, y: 47.5, type: 'tee' },
  { x: 87, y: 47.5, type: 'tee' },
  { x: 15.5, y: 37.5, type: 'elbow' },
  { x: 15.5, y: 61.5, type: 'elbow' },
  { x: 15.5, y: 30, type: 'inlet' },
];
