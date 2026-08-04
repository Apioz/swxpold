import type { DeviceOnlineStatus, HvacRoomReading, HvacSystemRuntime } from '../types/innovationCenter';

interface RoomTemplate {
  roomNo: string;
  roomName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseTemp: number;
  baseHumidity: number;
  basePressure: number;
  baseCo2: number;
}

/** AHU-103 细胞房空调通风系统 — 例图基准 */
const ahu103Rooms: RoomTemplate[] = [
  { roomNo: '5127', roomName: '更衣', x: 68, y: 8, width: 28, height: 20, baseTemp: 20.4, baseHumidity: 55.0, basePressure: 10, baseCo2: 450 },
  { roomNo: '5128', roomName: '缓冲', x: 68, y: 30, width: 28, height: 20, baseTemp: 20.5, baseHumidity: 55.0, basePressure: 19, baseCo2: 460 },
  { roomNo: '5130', roomName: '研发净化1', x: 68, y: 52, width: 28, height: 20, baseTemp: 20.2, baseHumidity: 55.0, basePressure: 23, baseCo2: 440 },
  { roomNo: '5129', roomName: '研发净化2', x: 68, y: 74, width: 28, height: 18, baseTemp: 20.6, baseHumidity: 54.0, basePressure: 22, baseCo2: 455 },
];

const systemRoomMap: Record<string, RoomTemplate[]> = {
  'hvac-1': ahu103Rooms,
  'hvac-2': [
    { roomNo: '5121', roomName: '更衣', x: 10, y: 18, width: 26, height: 32, baseTemp: 20.3, baseHumidity: 55.0, basePressure: 10, baseCo2: 448 },
    { roomNo: '5122', roomName: '缓冲', x: 38, y: 18, width: 24, height: 32, baseTemp: 20.4, baseHumidity: 55.0, basePressure: 18, baseCo2: 452 },
    { roomNo: '5124', roomName: '研发净化1', x: 66, y: 18, width: 24, height: 32, baseTemp: 20.1, baseHumidity: 55.0, basePressure: 22, baseCo2: 442 },
  ],
  'hvac-3': [
    { roomNo: '5118', roomName: '更衣', x: 12, y: 22, width: 30, height: 36, baseTemp: 20.0, baseHumidity: 55.0, basePressure: 10, baseCo2: 450 },
    { roomNo: '5119', roomName: '缓冲', x: 48, y: 22, width: 26, height: 36, baseTemp: 20.0, baseHumidity: 55.0, basePressure: 20, baseCo2: 450 },
    { roomNo: '5120', roomName: '研发净化', x: 78, y: 22, width: 18, height: 36, baseTemp: 20.0, baseHumidity: 55.0, basePressure: 25, baseCo2: 450 },
  ],
  'hvac-4': [
    { roomNo: '5131', roomName: '更衣', x: 6, y: 16, width: 22, height: 30, baseTemp: 20.3, baseHumidity: 55.0, basePressure: 10, baseCo2: 450 },
    { roomNo: '5132', roomName: '缓冲', x: 32, y: 16, width: 22, height: 30, baseTemp: 20.4, baseHumidity: 55.0, basePressure: 19, baseCo2: 458 },
    { roomNo: '5133', roomName: '研发净化1', x: 58, y: 16, width: 22, height: 30, baseTemp: 20.2, baseHumidity: 55.0, basePressure: 23, baseCo2: 445 },
    { roomNo: '5134', roomName: '研发净化2', x: 84, y: 16, width: 12, height: 30, baseTemp: 20.5, baseHumidity: 54.0, basePressure: 22, baseCo2: 453 },
  ],
  'hvac-5': [
    { roomNo: '8401', roomName: '8401-通用实验室1', x: 5, y: 20, width: 18, height: 28, baseTemp: 20.8, baseHumidity: 56.0, basePressure: 8, baseCo2: 520 },
    { roomNo: '8402', roomName: '8402-通用实验室2', x: 26, y: 20, width: 18, height: 28, baseTemp: 20.9, baseHumidity: 56.0, basePressure: 8, baseCo2: 515 },
    { roomNo: '8403', roomName: '8403-通用实验室3', x: 47, y: 20, width: 18, height: 28, baseTemp: 20.7, baseHumidity: 55.5, basePressure: 8, baseCo2: 510 },
    { roomNo: '8404', roomName: '8404-通用实验室4', x: 68, y: 20, width: 18, height: 28, baseTemp: 20.8, baseHumidity: 56.0, basePressure: 8, baseCo2: 518 },
    { roomNo: '8405', roomName: '8405-通用实验室6', x: 89, y: 20, width: 8, height: 28, baseTemp: 20.6, baseHumidity: 55.0, basePressure: 8, baseCo2: 505 },
  ],
  'hvac-6': [
    { roomNo: '8407', roomName: '8407-通用实验室9', x: 8, y: 20, width: 20, height: 30, baseTemp: 20.7, baseHumidity: 55.5, basePressure: 8, baseCo2: 512 },
    { roomNo: '8408', roomName: '8408-通用实验室5', x: 32, y: 20, width: 20, height: 30, baseTemp: 20.8, baseHumidity: 56.0, basePressure: 8, baseCo2: 508 },
    { roomNo: '8409', roomName: '8409-四层会议室', x: 56, y: 20, width: 20, height: 30, baseTemp: 20.5, baseHumidity: 54.0, basePressure: 6, baseCo2: 490 },
    { roomNo: '8410', roomName: '8410-通用实验室10', x: 80, y: 20, width: 16, height: 30, baseTemp: 20.9, baseHumidity: 56.0, basePressure: 8, baseCo2: 516 },
  ],
  'hvac-7': [
    { roomNo: '8415', roomName: '8415-净化室4', x: 8, y: 18, width: 24, height: 32, baseTemp: 20.2, baseHumidity: 55.0, basePressure: 15, baseCo2: 445 },
    { roomNo: '8418', roomName: '8418-净化室3', x: 36, y: 18, width: 24, height: 32, baseTemp: 20.3, baseHumidity: 55.0, basePressure: 16, baseCo2: 448 },
    { roomNo: '8419', roomName: '8419-净化室2', x: 64, y: 18, width: 24, height: 32, baseTemp: 20.1, baseHumidity: 55.0, basePressure: 14, baseCo2: 442 },
    { roomNo: '8423', roomName: '8423-净化室1', x: 36, y: 56, width: 24, height: 28, baseTemp: 20.0, baseHumidity: 54.5, basePressure: 18, baseCo2: 438 },
  ],
  'hvac-8': [
    { roomNo: '8301', roomName: '8301-三层会议室1', x: 10, y: 22, width: 28, height: 34, baseTemp: 20.5, baseHumidity: 54.0, basePressure: 5, baseCo2: 480 },
    { roomNo: '8304', roomName: '8304-三层会议室2', x: 42, y: 22, width: 28, height: 34, baseTemp: 20.6, baseHumidity: 54.0, basePressure: 5, baseCo2: 485 },
    { roomNo: '8322', roomName: '8322-纯水室', x: 74, y: 22, width: 22, height: 34, baseTemp: 20.3, baseHumidity: 55.0, basePressure: 6, baseCo2: 460 },
  ],
};

/** 例图 AHU-103 基准：设定温度 20.0℃ / 湿度 55%RH / 风速 5.7m/s / 风量 2509m³/h */
const systemBaseMetrics: Record<
  string,
  Omit<HvacSystemRuntime, 'systemId' | 'updatedAt' | 'rooms'>
> = {
  'hvac-1': {
    supplyAirTemp: 20.1,
    returnAirTemp: 20.1,
    supplyAirHumidity: 57.0,
    fanFrequency: 40.3,
    valveOpening: 12.0,
    airVolume: 2509,
    filterPressure: 15,
  },
  'hvac-2': {
    supplyAirTemp: 20.0,
    returnAirTemp: 20.2,
    supplyAirHumidity: 56.5,
    fanFrequency: 38.5,
    valveOpening: 15.2,
    airVolume: 2200,
    filterPressure: 14,
  },
  'hvac-3': {
    supplyAirTemp: 20.0,
    returnAirTemp: 20.0,
    supplyAirHumidity: 55.0,
    fanFrequency: 0,
    valveOpening: 0,
    airVolume: 0,
    filterPressure: 0,
  },
  'hvac-4': {
    supplyAirTemp: 20.1,
    returnAirTemp: 20.0,
    supplyAirHumidity: 57.0,
    fanFrequency: 42.0,
    valveOpening: 10.5,
    airVolume: 2800,
    filterPressure: 16,
  },
  'hvac-5': {
    supplyAirTemp: 20.5,
    returnAirTemp: 20.8,
    supplyAirHumidity: 58.0,
    fanFrequency: 36.0,
    valveOpening: 18.0,
    airVolume: 5200,
    filterPressure: 12,
  },
  'hvac-6': {
    supplyAirTemp: 20.4,
    returnAirTemp: 20.6,
    supplyAirHumidity: 57.5,
    fanFrequency: 35.0,
    valveOpening: 16.5,
    airVolume: 4800,
    filterPressure: 12,
  },
  'hvac-7': {
    supplyAirTemp: 20.0,
    returnAirTemp: 20.1,
    supplyAirHumidity: 56.0,
    fanFrequency: 45.0,
    valveOpening: 11.0,
    airVolume: 6000,
    filterPressure: 15,
  },
  'hvac-8': {
    supplyAirTemp: 20.0,
    returnAirTemp: 20.0,
    supplyAirHumidity: 55.0,
    fanFrequency: 0,
    valveOpening: 0,
    airVolume: 0,
    filterPressure: 0,
  },
};

function jitter(base: number, range: number, offline: boolean, seed = 0): number {
  if (offline) return 0;
  const wave = Math.sin(Date.now() / 5000 + seed) * range * 0.45;
  return Math.round((base + wave) * 10) / 10;
}

function jitterInt(base: number, range: number, offline: boolean, seed = 0): number {
  if (offline) return 0;
  const wave = Math.sin(Date.now() / 5000 + seed) * range * 0.45;
  return Math.round(base + wave);
}

function roomStatus(systemOffline: boolean, roomNo: string): DeviceOnlineStatus {
  if (systemOffline) return 'offline';
  if (roomNo.endsWith('0') && Math.sin(Date.now() / 8000) > 0.98) return 'alarm';
  return 'online';
}

function buildRooms(templates: RoomTemplate[], systemOffline: boolean): HvacRoomReading[] {
  return templates.map((t, i) => {
    const status = roomStatus(systemOffline, t.roomNo);
    const offline = systemOffline || status === 'offline';
    return {
      roomNo: t.roomNo,
      roomName: t.roomName,
      x: t.x,
      y: t.y,
      width: t.width,
      height: t.height,
      temperature: jitter(t.baseTemp, 0.3, offline, i),
      humidity: jitter(t.baseHumidity, 1.0, offline, i + 1),
      pressure: jitter(t.basePressure, 1.5, offline, i + 2),
      co2: jitterInt(t.baseCo2, 15, offline, i + 3),
      status,
    };
  });
}

export function getHvacSystemRuntime(
  systemId: string,
  systemOffline = false,
): HvacSystemRuntime | null {
  const templates = systemRoomMap[systemId];
  const metrics = systemBaseMetrics[systemId];
  if (!templates || !metrics) return null;

  const offline = systemOffline;
  const now = new Date();
  const updatedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  return {
    systemId,
    supplyAirTemp: jitter(metrics.supplyAirTemp, 0.2, offline, 1),
    returnAirTemp: jitter(metrics.returnAirTemp, 0.2, offline, 2),
    supplyAirHumidity: jitter(metrics.supplyAirHumidity, 0.8, offline, 3),
    fanFrequency: jitter(metrics.fanFrequency, 0.5, offline, 4),
    valveOpening: jitter(metrics.valveOpening, 0.8, offline, 5),
    airVolume: jitterInt(metrics.airVolume, 30, offline, 6),
    filterPressure: jitterInt(metrics.filterPressure, 2, offline, 7),
    updatedAt,
    rooms: buildRooms(templates, offline),
  };
}

export function getControlledRoomCount(systemId: string): number {
  return systemRoomMap[systemId]?.length ?? 0;
}
