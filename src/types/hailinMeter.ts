export type HailinMeterStatus = 'online' | 'offline' | 'alarm';
export type HailinSensorStatus = '正常' | '异常';
export type CalibrationStatus = '正常' | '即将到期' | '已过期';

/** 海林能量计设备台账 */
export interface HailinMeterDevice {
  id: string;
  code: string;
  zone: string;
  medium: string;
  installLocation: string;
  rangeSpec: string;
  protocol: string;
  roomNo: string;
  status: HailinMeterStatus;
  instantFlow: number;
  todayCumulative: number;
  nextCalibration: string;
  calibrationStatus: CalibrationStatus;
  pipePressure?: number;
  waterTemp?: number;
}

/** 海林能量计实时监测数据（字段与业务表一致） */
export interface HailinMeterRuntime {
  deviceId: string;
  /** 设备名称 */
  deviceName: string;
  /** 所属房间 */
  room: string;
  status: HailinMeterStatus;
  /** 状态文本：在线 / 离线 */
  statusText: string;
  /** 更新时间 */
  updateTime: string;
  /** 标准累计流量(m³) */
  stdCumulativeFlow: number;
  /** 标准瞬时流量(m³/h) */
  stdInstantFlow: number;
  /** 标准热功率(Wh) */
  stdThermalPower: number;
  /** 标准当前热 */
  stdCurrentHeat: number;
  /** 标准当前冷 */
  stdCurrentCold: number;
  integratorFault: HailinSensorStatus;
  inletTempSensor: HailinSensorStatus;
  returnTempSensor: HailinSensorStatus;
  flowSensor: HailinSensorStatus;
  batteryVoltage: string;
  /** 累计工作时间 */
  cumulativeWorkHours: number;
  returnWaterTemp: number;
  supplyWaterTemp: number;
  cumulativeFlowUnit: string;
  cumulativeFlow: number;
  instantFlowUnit: string;
  instantFlow: number;
  powerUnit: string;
  thermalPower: number;
  heatUnit: string;
  currentHeat: number;
  coldUnit: string;
  currentCold: number;
}

/** 管网监控树节点 */
export interface HailinNetworkNode {
  key: string;
  title: string;
  code?: string;
  status?: HailinMeterStatus;
  children?: HailinNetworkNode[];
}

/** 管网流程图管线 */
export interface HailinPipeSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pipeType: 'main' | 'branch';
}

/** 管网流程图节点 */
export interface HailinDiagramNode {
  deviceId: string;
  code: string;
  label: string;
  x: number;
  y: number;
  status: HailinMeterStatus;
  instantFlow: number;
  cumulativeFlow: number;
  nodeType: 'main' | 'branch' | 'terminal';
  subLabel?: string;
}

/** 管网平面图分区 */
export interface HailinNetworkZone {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  roomType: 'corridor' | 'utility' | 'zone';
}

/** 分时流量明细 */
export interface HailinHourlyRecord {
  id: string;
  timeSlot: string;
  readings: Record<string, { instant: number | null; cumulative: number | null }>;
}

export const HAILIN_ZONES = ['全部', '厂区总进水', '生产用水区', '生活用水区', '绿化/外排', '8号楼', '7号楼'];
export const HAILIN_MEDIUMS = ['全部', '清水', '污水', '空调冷热水'];
export const HAILIN_PROTOCOLS = ['Modbus', 'NB-IoT', 'RS485'];
