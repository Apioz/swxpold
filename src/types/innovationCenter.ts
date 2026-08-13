export type DeviceOnlineStatus = 'online' | 'offline' | 'alarm';

export type FacilityDeviceType =
  | '纯水流量计'
  | '压差计'
  | '电表'
  | '温湿度传感器'
  | '氧浓度'
  | '门禁'
  | '摄像头'
  | '会议屏'
  | '门禁控制器';

export const FACILITY_DEVICE_TYPES: FacilityDeviceType[] = [
  '纯水流量计',
  '压差计',
  '电表',
  '温湿度传感器',
  '氧浓度',
  '门禁',
  '摄像头',
  '会议屏',
  '门禁控制器',
];

/** 流量计设备管理页展示的设备类型 */
export const FLOW_METER_MANAGEMENT_TYPES = [
  '纯水流量计',
  '压差计',
  '温湿度传感器',
] as const satisfies readonly FacilityDeviceType[];

export type FlowMeterManagementDeviceType = (typeof FLOW_METER_MANAGEMENT_TYPES)[number];

export interface FlowMeterDevice {
  id: string;
  indexNo: number;
  deviceType: FacilityDeviceType;
  roomNo: string;
  name: string;
  code: string;
  ip: string;
  floorId: string;
  mapX: number;
  mapY: number;
  status: DeviceOnlineStatus;
  flowRate?: number;
  unit?: string;
  lastUpdate?: string;
  /** 规格 / MAC / 账号等扩展字段 */
  spec?: string;
  mac?: string;
  account?: string;
  password?: string;
  gateway?: string;
  /** 台账统一字段 */
  installLocation?: string;
  integrationAddress?: string;
  serialNo?: string;
  channelNo?: string;
  bindingStatus?: string;
  brand?: string;
  model?: string;
}

export interface FloorDeviceTypeStat {
  type: string;
  online: number;
  offline: number;
  alarm: number;
}

export interface PlcHvacSystem {
  id: string;
  indexNo: number;
  roomNo: string;
  systemName: string;
  screenName: string;
  systemCode: string;
  category: '暖通' | 'PLC';
  status: DeviceOnlineStatus;
  ip?: string;
  modbusGateway?: string;
}

/** 风系统管控房间实时读数 */
export interface HvacRoomReading {
  roomNo: string;
  roomName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  temperature: number;
  humidity: number;
  pressure: number;
  co2: number;
  status: DeviceOnlineStatus;
}

/** 风系统运行监测数据 */
export interface HvacSystemRuntime {
  systemId: string;
  supplyAirTemp: number;
  returnAirTemp: number;
  supplyAirHumidity: number;
  fanFrequency: number;
  valveOpening: number;
  airVolume: number;
  filterPressure: number;
  updatedAt: string;
  rooms: HvacRoomReading[];
}

/** 设备实时读数项 */
export interface FlowMeterReadingItem {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  accent?: string;
}

/** 设备运行监测数据 */
export interface FlowMeterDeviceRuntime {
  deviceId: string;
  updatedAt: string;
  readings: FlowMeterReadingItem[];
}

export const DEVICE_TYPE_COLUMN_LABELS: Record<
  FacilityDeviceType,
  { name: string; code: string; ip?: string }
> = {
  纯水流量计: { name: '纯水流量计命名', code: '纯水流量计编号', ip: '纯水流量计设备IP' },
  压差计: { name: '压差计命名', code: '压差计编号' },
  电表: { name: '电表命名', code: '电表编号', ip: '电表设备IP' },
  温湿度传感器: { name: '温湿度命名', code: '温湿度编号' },
  氧浓度: { name: '氧浓度命名', code: '氧浓度编号', ip: 'IP' },
  门禁: { name: '门禁命名', code: '门禁编号', ip: '门禁设备IP' },
  摄像头: { name: '设备名称', code: '设备编号', ip: '设备IP' },
  会议屏: { name: '会议屏命名', code: '会议屏编号', ip: '会议屏设备IP' },
  门禁控制器: { name: '门禁控制器命名', code: '门禁控制器SN编号', ip: '门禁控制器设备IP' },
};
