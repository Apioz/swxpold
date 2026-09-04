import type { DefaultOptionType } from 'antd/es/cascader';

/** 楼栋 → 楼层 → 房间/空间 */
export const MEETING_ROOM_SPACE_CASCADER_OPTIONS: DefaultOptionType[] = [
  {
    value: '综合办公楼1#',
    label: '综合办公楼1#',
    children: [
      {
        value: '1F',
        label: '1F',
        children: [
          { value: '1106室', label: '1106室' },
          { value: '1104室', label: '1104室' },
          { value: '1103室', label: '1103室' },
          { value: '茶水间', label: '茶水间' },
          { value: '男厕', label: '男厕' },
          { value: '女厕', label: '女厕' },
        ],
      },
      {
        value: '2F',
        label: '2F',
        children: [
          { value: '2101室', label: '2101室' },
          { value: '2102室', label: '2102室' },
        ],
      },
      {
        value: '3F',
        label: '3F',
        children: [{ value: '1304室', label: '1304室' }],
      },
      {
        value: '3MF',
        label: '3MF',
        children: [{ value: '3MF-01', label: '3MF-01' }],
      },
    ],
  },
  {
    value: '综合办公楼2#',
    label: '综合办公楼2#',
    children: [
      {
        value: '2F',
        label: '2F',
        children: [
          { value: '2202室', label: '2202室' },
          { value: '2204室', label: '2204室' },
          { value: '2210室', label: '2210室' },
        ],
      },
    ],
  },
  {
    value: '工程楼3#',
    label: '工程楼3#',
    children: [
      {
        value: '1F',
        label: '1F',
        children: [{ value: '3101室', label: '3101室' }],
      },
    ],
  },
  {
    value: '研发实验楼5#',
    label: '研发实验楼5#',
    children: [
      {
        value: '1F',
        label: '1F',
        children: [{ value: '5101室', label: '5101室' }],
      },
    ],
  },
  {
    value: '研发实验楼6#',
    label: '研发实验楼6#',
    children: [
      {
        value: '1F',
        label: '1F',
        children: [{ value: '6101室', label: '6101室' }],
      },
    ],
  },
  {
    value: '研发实验楼7#',
    label: '研发实验楼7#',
    children: [
      {
        value: '1F',
        label: '1F',
        children: [{ value: '7101室', label: '7101室' }],
      },
    ],
  },
  {
    value: '分子医学楼8#',
    label: '分子医学楼8#',
    children: [
      {
        value: '3F',
        label: '3F',
        children: [
          { value: '8331室', label: '8331室' },
          { value: '8301室', label: '8301室' },
          { value: '8304室', label: '8304室' },
        ],
      },
    ],
  },
];

export function formatMeetingRoomSpaceLocation(
  building: string,
  floor: string,
  room: string,
): string {
  return `${building} | ${floor} | ${room}`;
}

/** 将已保存的空间位置解析为 Cascader 路径 */
export function parseMeetingRoomSpacePath(spaceLocation?: string): string[] {
  if (!spaceLocation?.includes('|')) return [];
  const parts = spaceLocation.split('|').map((part) => part.trim()).filter(Boolean);
  return parts.length >= 3 ? parts.slice(0, 3) : [];
}

export function resolveBuildingFromSpaceLocation(spaceLocation: string): string {
  return spaceLocation.split('|')[0]?.trim() ?? spaceLocation.trim();
}

export function applyMeetingRoomSpaceSelection(path: string[]): {
  spaceLocation: string;
  address: string;
  building: string;
} | null {
  if (path.length < 3) return null;
  const [building, floor, room] = path;
  const spaceLocation = formatMeetingRoomSpaceLocation(building, floor, room);
  return {
    spaceLocation,
    address: spaceLocation,
    building,
  };
}
