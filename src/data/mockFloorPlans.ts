import type {
  FloorDeviceTypeStat,
  FloorPlanDetail,
  FloorPlanNode,
  FlowMeterDevice,
} from '../types/innovationCenter';
import { getFlowMetersByFloor } from './mockFlowMeters';

/** 园区 → 楼栋 → 楼层 三级树 */
export const floorPlanTree: FloorPlanNode[] = [
  {
    key: 'campus-biochip',
    title: '生物芯片智慧园区',
    nodeType: 'campus',
    children: [
      {
        key: 'building8',
        title: '8号楼',
        nodeType: 'building',
        children: [
          { key: 'building8-1f', title: '一楼', floorId: 'building8-1f', nodeType: 'floor', isLeaf: true },
          { key: 'building8-2f', title: '二楼', floorId: 'building8-2f', nodeType: 'floor', isLeaf: true },
          { key: 'building8-3f', title: '三楼', floorId: 'building8-3f', nodeType: 'floor', isLeaf: true },
          { key: 'building8-4f', title: '四楼', floorId: 'building8-4f', nodeType: 'floor', isLeaf: true },
          { key: 'building8-roof', title: '楼顶', floorId: 'building8-roof', nodeType: 'floor', isLeaf: true },
        ],
      },
      {
        key: 'building7',
        title: '7号楼',
        nodeType: 'building',
        children: [
          { key: 'building7-1f', title: '一楼', floorId: 'building7-1f', nodeType: 'floor', isLeaf: true },
          { key: 'building7-2f', title: '二楼', floorId: 'building7-2f', nodeType: 'floor', isLeaf: true },
          { key: 'building7-3f', title: '三楼', floorId: 'building7-3f', nodeType: 'floor', isLeaf: true },
        ],
      },
      {
        key: 'building6',
        title: '6号楼',
        nodeType: 'building',
        children: [
          { key: 'building6-1f', title: '一楼', floorId: 'building6-1f', nodeType: 'floor', isLeaf: true },
          { key: 'building6-2f', title: '二楼', floorId: 'building6-2f', nodeType: 'floor', isLeaf: true },
        ],
      },
      {
        key: 'building-aux',
        title: '附属设施楼',
        nodeType: 'building',
        children: [
          { key: 'building-aux-1f', title: '一楼', floorId: 'building-aux-1f', nodeType: 'floor', isLeaf: true },
          { key: 'building-aux-2f', title: '二楼', floorId: 'building-aux-2f', nodeType: 'floor', isLeaf: true },
        ],
      },
    ],
  },
];

const floor3Rooms: FloorPlanDetail['rooms'] = [
  { id: '8301', label: '8301', x: 8, y: 12, width: 14, height: 18 },
  { id: '8302', label: '8302', x: 24, y: 12, width: 14, height: 18 },
  { id: '8304', label: '8304', x: 40, y: 12, width: 14, height: 18 },
  { id: '8319', label: '8319', x: 56, y: 12, width: 14, height: 18 },
  { id: '8320', label: '8320', x: 72, y: 12, width: 14, height: 18 },
  { id: '8322', label: '8322', x: 8, y: 34, width: 18, height: 22 },
  { id: '8323', label: '8323', x: 28, y: 34, width: 14, height: 18 },
  { id: '8324', label: '8324', x: 44, y: 34, width: 14, height: 18 },
  { id: '8325', label: '8325', x: 60, y: 34, width: 14, height: 18 },
  { id: '8327', label: '8327', x: 76, y: 34, width: 14, height: 18 },
  { id: 'corridor-3f', label: '走廊', x: 8, y: 60, width: 82, height: 10 },
  { id: '3F水井间', label: '3F水井间', x: 8, y: 74, width: 20, height: 14 },
];

const floor4Rooms: FloorPlanDetail['rooms'] = [
  { id: '8401', label: '8401', x: 6, y: 10, width: 12, height: 16 },
  { id: '8402', label: '8402', x: 20, y: 10, width: 12, height: 16 },
  { id: '8403', label: '8403', x: 34, y: 10, width: 12, height: 16 },
  { id: '8404', label: '8404', x: 48, y: 10, width: 12, height: 16 },
  { id: '8405', label: '8405', x: 62, y: 10, width: 12, height: 16 },
  { id: '8406', label: '8406', x: 76, y: 10, width: 12, height: 16 },
  { id: '8407', label: '8407', x: 6, y: 30, width: 12, height: 16 },
  { id: '8408', label: '8408', x: 20, y: 30, width: 12, height: 16 },
  { id: '8409', label: '8409', x: 34, y: 30, width: 12, height: 16 },
  { id: '8410', label: '8410', x: 48, y: 30, width: 12, height: 16 },
  { id: '8411', label: '8411', x: 62, y: 30, width: 12, height: 16 },
  { id: '8412', label: '8412', x: 76, y: 30, width: 12, height: 16 },
  { id: '8413', label: '8413', x: 6, y: 50, width: 12, height: 16 },
  { id: '8414', label: '8414', x: 20, y: 50, width: 12, height: 16 },
  { id: '8415', label: '8415', x: 34, y: 50, width: 12, height: 16 },
  { id: '8418', label: '8418', x: 48, y: 50, width: 12, height: 16 },
  { id: '8419', label: '8419', x: 62, y: 50, width: 12, height: 16 },
  { id: '8423', label: '8423', x: 76, y: 50, width: 12, height: 16 },
  { id: 'corridor-4f', label: '走廊', x: 6, y: 70, width: 82, height: 10 },
  { id: '4F水井间', label: '4F水井间', x: 6, y: 84, width: 18, height: 12 },
];

function genericRooms(seed: number): FloorPlanDetail['rooms'] {
  return [
    { id: `z-a-${seed}`, label: 'A区', x: 8, y: 14, width: 38, height: 32 },
    { id: `z-b-${seed}`, label: 'B区', x: 52, y: 14, width: 38, height: 32 },
    { id: `z-c-${seed}`, label: 'C区', x: 8, y: 52, width: 38, height: 28 },
    { id: `z-d-${seed}`, label: 'D区', x: 52, y: 52, width: 38, height: 28 },
    { id: `corridor-${seed}`, label: '走廊', x: 8, y: 84, width: 82, height: 10 },
  ];
}

function makeFloorDetail(
  id: string,
  buildingName: string,
  floorLabel: string,
  rooms: FloorPlanDetail['rooms'],
): FloorPlanDetail {
  return {
    id,
    buildingName,
    floorLabel,
    floorName: `${buildingName}-${floorLabel}`,
    rooms,
  };
};

const building8Name = '生物芯片智慧园区8号楼';
const building7Name = '生物芯片智慧园区7号楼';
const building6Name = '生物芯片智慧园区6号楼';
const buildingAuxName = '生物芯片智慧园区附属设施楼';

export const floorPlanDetails: Record<string, FloorPlanDetail> = {
  'building8-1f': makeFloorDetail('building8-1f', building8Name, '一楼', genericRooms(1)),
  'building8-2f': makeFloorDetail('building8-2f', building8Name, '二楼', genericRooms(2)),
  'building8-3f': makeFloorDetail('building8-3f', building8Name, '三楼', floor3Rooms),
  'building8-4f': makeFloorDetail('building8-4f', building8Name, '四楼', floor4Rooms),
  'building8-roof': makeFloorDetail('building8-roof', building8Name, '楼顶', [
    { id: 'roof-ap', label: '楼顶AP区', x: 20, y: 30, width: 60, height: 40 },
  ]),
  'building7-1f': makeFloorDetail('building7-1f', building7Name, '一楼', genericRooms(7)),
  'building7-2f': makeFloorDetail('building7-2f', building7Name, '二楼', genericRooms(8)),
  'building7-3f': makeFloorDetail('building7-3f', building7Name, '三楼', genericRooms(9)),
  'building6-1f': makeFloorDetail('building6-1f', building6Name, '一楼', genericRooms(10)),
  'building6-2f': makeFloorDetail('building6-2f', building6Name, '二楼', genericRooms(11)),
  'building-aux-1f': makeFloorDetail('building-aux-1f', buildingAuxName, '一楼', genericRooms(12)),
  'building-aux-2f': makeFloorDetail('building-aux-2f', buildingAuxName, '二楼', genericRooms(13)),
};

export function walkFloorPlanTree(
  visitor: (node: FloorPlanNode, parents: FloorPlanNode[]) => void,
  nodes: FloorPlanNode[] = floorPlanTree,
  parents: FloorPlanNode[] = [],
) {
  nodes.forEach((node) => {
    visitor(node, parents);
    if (node.children) {
      walkFloorPlanTree(visitor, node.children, [...parents, node]);
    }
  });
}

export function findFloorPlanNode(key: string): {
  node: FloorPlanNode;
  parents: FloorPlanNode[];
} | null {
  let found: { node: FloorPlanNode; parents: FloorPlanNode[] } | null = null;
  walkFloorPlanTree((node, parents) => {
    if (node.key === key) {
      found = { node, parents };
    }
  });
  return found;
}

export function findFloorPlanNodeByFloorId(floorId: string): {
  node: FloorPlanNode;
  parents: FloorPlanNode[];
} | null {
  let found: { node: FloorPlanNode; parents: FloorPlanNode[] } | null = null;
  walkFloorPlanTree((node, parents) => {
    if (node.floorId === floorId) {
      found = { node, parents };
    }
  });
  return found;
}

export function getAllFloorNodes(): FloorPlanNode[] {
  const floors: FloorPlanNode[] = [];
  walkFloorPlanTree((node) => {
    if (node.nodeType === 'floor' && node.floorId) {
      floors.push(node);
    }
  });
  return floors;
}

/** 同楼栋下的楼层列表，供平面图 Tab 切换 */
export function getBuildingFloorsByFloorId(floorId: string): FloorPlanNode[] {
  const match = findFloorPlanNodeByFloorId(floorId);
  if (!match) return [];
  const building = match.parents[match.parents.length - 1];
  return (building?.children ?? []).filter((n) => n.nodeType === 'floor');
}

export function getCampusSummary() {
  const buildings = floorPlanTree[0]?.children ?? [];
  const floors = getAllFloorNodes();
  let totalDevices = 0;
  floors.forEach((f) => {
    if (f.floorId) totalDevices += getFlowMetersByFloor(f.floorId).length;
  });
  return {
    campusName: floorPlanTree[0]?.title ?? '园区',
    buildingCount: buildings.length,
    floorCount: floors.length,
    deviceCount: totalDevices,
  };
}

export function getBuildingSummary(buildingKey: string) {
  const match = findFloorPlanNode(buildingKey);
  if (!match || match.node.nodeType !== 'building') {
    return null;
  }
  const floors = match.node.children ?? [];
  let deviceCount = 0;
  floors.forEach((f) => {
    if (f.floorId) deviceCount += getFlowMetersByFloor(f.floorId).length;
  });
  return {
    buildingName: match.node.title,
    floorCount: floors.length,
    deviceCount,
  };
}

export function getFloorDeviceStats(floorId: string): {
  online: number;
  offline: number;
  alarm: number;
  typeStats: FloorDeviceTypeStat[];
} {
  const devices = getFlowMetersByFloor(floorId);
  const online = devices.filter((d) => d.status === 'online').length;
  const offline = devices.filter((d) => d.status === 'offline').length;
  const alarm = devices.filter((d) => d.status === 'alarm').length;

  const countByStatus = (list: typeof devices) => ({
    online: list.filter((d) => d.status === 'online').length,
    offline: list.filter((d) => d.status === 'offline').length,
    alarm: list.filter((d) => d.status === 'alarm').length,
  });

  const typeMap = new Map<string, FlowMeterDevice[]>();
  devices.forEach((d) => {
    const list = typeMap.get(d.deviceType) ?? [];
    list.push(d);
    typeMap.set(d.deviceType, list);
  });

  const typeStats: FloorDeviceTypeStat[] = Array.from(typeMap.entries())
    .map(([type, list]) => ({ type, ...countByStatus(list) }))
    .filter((t) => t.online + t.offline + t.alarm > 0);

  return { online, offline, alarm, typeStats };
}

export function findFloorTitle(floorId: string): string {
  return floorPlanDetails[floorId]?.floorName ?? floorId;
}

export function getFloorPlanBreadcrumb(floorId: string): string[] {
  const match = findFloorPlanNodeByFloorId(floorId);
  if (!match) return [];
  return [...match.parents.map((p) => p.title), match.node.title];
}
