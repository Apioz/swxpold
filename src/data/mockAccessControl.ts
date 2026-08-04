import type { AccessControlGroup } from '../types/accessControl';
import { getDevicesByType } from './mockFlowMeters';

function findDoorIds(keywords: string[]): string[] {
  const doors = getDevicesByType('门禁');
  return doors
    .filter((d) => keywords.some((kw) => d.name.includes(kw) || d.roomNo.includes(kw)))
    .map((d) => d.id);
}

const cleanRoomDoors = findDoorIds(['8415', '8418', '8419', '8423']);
const labDoors = findDoorIds(['8401', '8402', '8403', '8404', '8410', '8411']);
const meetingDoors = findDoorIds(['8409', '8301', '8304']);

export const mockAccessControlGroups: AccessControlGroup[] = [
  {
    id: 'acg-001',
    groupName: '净化室门禁组',
    description: '管控净化室1~4及洗消间区域门禁，仅授权研发及实验人员可通行',
    doorPointIds: cleanRoomDoors.slice(0, 4),
    authorizedPersonIds: ['p-001', 'p-002', 'p-003', 'p-007'],
    updater: '管理员1',
    updateTime: '2026-08-03 10:30:00',
  },
  {
    id: 'acg-002',
    groupName: '通用实验室门禁组',
    description: '四层通用实验室区域门禁权限',
    doorPointIds: labDoors.slice(0, 6),
    authorizedPersonIds: ['p-003', 'p-004', 'p-009'],
    updater: 'admin',
    updateTime: '2026-08-02 16:45:00',
  },
  {
    id: 'acg-003',
    groupName: '会议室门禁组',
    description: '各层会议室门禁，行政及管理人员可通行',
    doorPointIds: meetingDoors,
    authorizedPersonIds: ['p-005', 'p-010', 'p-011'],
    updater: '管理员1',
    updateTime: '2026-08-01 09:15:00',
  },
  {
    id: 'acg-004',
    groupName: '安保巡检门禁组',
    description: '安保人员全区域巡检通行权限',
    doorPointIds: [...cleanRoomDoors.slice(0, 2), ...meetingDoors.slice(0, 1)],
    authorizedPersonIds: ['p-006'],
    updater: 'admin',
    updateTime: '2026-07-28 14:20:00',
  },
];
