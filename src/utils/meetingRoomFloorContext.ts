import type { MidPlatformMeetingRoom } from '../types/midPlatformMeetingRoom';
import type { SelectedDocumentImage, SelectedFloorPlan } from '../types/foundationDocument';
import { parseMeetingRoomSpacePath } from '../data/meetingRoomSpaceOptions';

export function getMeetingRoomFloorKey(building: string, floor: string): string {
  return `${building.trim()}__${floor.trim()}`;
}

export function parseFloorFromAddress(address: string): string {
  const segments = address
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
  if (segments.length >= 2) return segments[1];
  const match = address.match(/\|\s*(\d+F)\s*\|/i);
  return match?.[1] ?? '';
}

export function resolveMeetingRoomBuilding(input: {
  building?: string;
  spaceLocation?: string;
  address?: string;
  cover?: { building?: string } | null;
}): string {
  if (input.cover?.building?.trim()) return input.cover.building.trim();
  if (input.building?.trim()) return input.building.trim();
  if (input.spaceLocation?.includes('|')) {
    return input.spaceLocation.split('|')[0]?.trim() ?? '';
  }
  if (input.spaceLocation?.trim()) return input.spaceLocation.trim();
  if (input.address?.includes('分子医学楼8#')) return '分子医学楼8#';
  if (input.address?.includes('综合办公楼1#')) return '综合办公楼1#';
  if (input.address?.includes('综合办公楼2#')) return '综合办公楼2#';
  return '';
}

export function resolveMeetingRoomFloor(input: {
  address?: string;
  spaceLocation?: string;
  cover?: { floor?: string } | null;
}): string {
  if (input.cover?.floor?.trim()) return input.cover.floor.trim();
  if (input.spaceLocation?.includes('|')) {
    const floor = input.spaceLocation.split('|')[1]?.trim();
    if (floor) return floor;
  }
  if (input.address) return parseFloorFromAddress(input.address);
  return '';
}

export function resolveMeetingRoomFloorContext(input: {
  building?: string;
  spaceLocation?: string;
  address?: string;
  cover?: MidPlatformMeetingRoom['cover'];
}): { building: string; floor: string; floorKey: string } | null {
  const building = resolveMeetingRoomBuilding(input);
  const floor = resolveMeetingRoomFloor(input);
  if (!building || !floor) return null;
  return { building, floor, floorKey: getMeetingRoomFloorKey(building, floor) };
}

/** 从会议室记录解析楼层上下文（与编辑弹窗逻辑一致） */
export function resolveMeetingRoomFloorContextFromRecord(
  record: Partial<Pick<MidPlatformMeetingRoom, 'building' | 'spaceLocation' | 'address' | 'cover'>>,
): { building: string; floor: string; floorKey: string } | null {
  const path = parseMeetingRoomSpacePath(record.spaceLocation);
  const resolved = resolveMeetingRoomFloorContext({
    building: record.building?.trim() || path[0],
    spaceLocation: record.spaceLocation,
    address: record.address,
    cover: record.cover,
  });
  if (resolved) return resolved;

  if (path.length >= 2) {
    const building = path[0]?.trim() ?? '';
    const floor = path[1]?.trim() ?? '';
    if (building && floor) {
      return { building, floor, floorKey: getMeetingRoomFloorKey(building, floor) };
    }
  }
  return null;
}

export function isSameMeetingRoomFloor(
  room: MidPlatformMeetingRoom,
  building: string,
  floor: string,
): boolean {
  const ctx = resolveMeetingRoomFloorContext({
    building: room.building,
    spaceLocation: room.spaceLocation,
    address: room.address,
    cover: room.cover,
  });
  return ctx?.building === building && ctx?.floor === floor;
}

/** 楼层平面图 ID（文档中心与本地共用，同楼层保持一致） */
export function resolveManagedFloorPlanId(building: string, floor: string): string {
  if (building.includes('综合办公楼2#') && floor === '2F') return 'office2-2f';
  if (building.includes('综合办公楼1#') && floor === '1F') return 'office1-1f';
  if (building.includes('综合办公楼1#') && floor === '3F') return 'office1-3f';
  if ((building.includes('分子医学楼8#') || building.includes('8#')) && floor === '3F') {
    return 'lab8-3f';
  }
  const slug = getMeetingRoomFloorKey(building, floor)
    .replace(/#/g, '')
    .replace(/\s+/g, '-')
    .replace(/__+/g, '-');
  return `managed-${slug}`;
}

export function buildLocalCoverSelection(
  file: File,
  building: string,
  floor: string,
  imageUrl: string,
): SelectedDocumentImage {
  return {
    imageId: `local-cover-${Date.now()}`,
    imageName: file.name,
    imageUrl,
    documentPath: `数据库存储 / ${building} / ${floor} / ${file.name}`,
    campus: '生物芯片智慧园区',
    building,
    floor,
    floorPlanId: '',
    floorPlanUrl: '',
  };
}

export function buildLocalFloorPlanSelection(
  file: File,
  building: string,
  floor: string,
  imageUrl: string,
  floorPlanId?: string,
): SelectedFloorPlan {
  return {
    imageId: `local-${Date.now()}`,
    imageName: file.name,
    imageUrl,
    documentPath: `数据库存储 / ${building} / ${floor} / ${file.name}`,
    campus: '生物芯片智慧园区',
    building,
    floor,
    floorPlanId: floorPlanId ?? resolveManagedFloorPlanId(building, floor),
  };
}

export function readLocalImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('无法读取图片文件'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('无法读取图片文件'));
    reader.readAsDataURL(file);
  });
}

export function isDisplayableFloorPlanImage(url: string, fileName?: string): boolean {
  if (url.startsWith('data:image/')) return true;
  if (url.startsWith('blob:')) return true;
  if (/\.(png|jpe?g|svg|webp)(\?|$)/i.test(url)) return true;
  if (fileName && /\.(png|jpe?g|svg|webp)$/i.test(fileName)) return true;
  return false;
}
