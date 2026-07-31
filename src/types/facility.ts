import type { EventDevice } from './security';

/** 设施管理中台 - 设备中心 IA 物联网属性 */
export interface FacilityIADevice {
  id: string;
  /** IA_设备编号 */
  iaDeviceCode: string;
  /** IA_设备名称 */
  iaDeviceName: string;
  /** IA_集成分类 */
  integrationCategory: string;
  /** 映射到事件类型字典的设备分类 */
  eventDevice: EventDevice;
  protocolManufacturer?: string;
  portNumber?: string;
  protocolType?: string;
  connectionMethod?: string;
  ipAddress?: string;
  location?: string;
}

/** IA_集成分类 → 事件设备分类 */
export const INTEGRATION_CATEGORY_MAP: Record<string, EventDevice> = {
  监控设备: '监控',
  门禁设备: '门禁',
  动环设备: '动环设备',
  道闸设备: '道闸设备',
  低压设备: '低压设备',
  暖通设备: '暖通',
  纯水流量计: '纯水流量计',
  压差计: '压差计',
  电表: '电表',
  温湿度传感器: '温湿度传感器',
  氧浓度: '氧浓度',
  PLC: 'PLC',
  modbus网关: 'modbus网关',
};

export function resolveEventDeviceFromCategory(
  integrationCategory: string,
): EventDevice {
  return INTEGRATION_CATEGORY_MAP[integrationCategory] ?? '监控';
}

/** 仅保留同时具有 IA_设备编号 与 IA_设备名称 的 IA 设备 */
export function filterIADevices(devices: FacilityIADevice[]): FacilityIADevice[] {
  return devices.filter(
    (d) => d.iaDeviceCode.trim() !== '' && d.iaDeviceName.trim() !== '',
  );
}

export function formatIADeviceLabel(device: FacilityIADevice): string {
  return `${device.iaDeviceName}（${device.iaDeviceCode}）`;
}
