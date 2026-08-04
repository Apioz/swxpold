import dayjs from 'dayjs';
import type {
  HailinDiagramNode,
  HailinHourlyRecord,
  HailinMeterDevice,
  HailinMeterRuntime,
  HailinNetworkNode,
  HailinPipeSegment,
} from '../types/hailinMeter';

const baseDevices: Omit<HailinMeterDevice, 'id'>[] = [
  {
    code: 'W001',
    zone: '厂区总进水',
    medium: '清水',
    installLocation: '市政进水总管',
    rangeSpec: '0~500 m³/h',
    protocol: 'Modbus',
    roomNo: '安德永兴',
    status: 'online',
    instantFlow: 216.0,
    todayCumulative: 1285.0,
    nextCalibration: '2026-06-15',
    calibrationStatus: '正常',
    pipePressure: 0.42,
    waterTemp: 18.2,
  },
  {
    code: 'W002',
    zone: '生产用水区',
    medium: '清水',
    installLocation: '生产车间1#进水',
    rangeSpec: '0~200 m³/h',
    protocol: 'Modbus',
    roomNo: '8401',
    status: 'online',
    instantFlow: 78.5,
    todayCumulative: 456.2,
    nextCalibration: '2026-05-20',
    calibrationStatus: '正常',
    pipePressure: 0.38,
    waterTemp: 17.8,
  },
  {
    code: 'W007',
    zone: '生产用水区',
    medium: '清水',
    installLocation: '生产车间2#进水',
    rangeSpec: '0~200 m³/h',
    protocol: 'Modbus',
    roomNo: '8402',
    status: 'online',
    instantFlow: 65.3,
    todayCumulative: 389.1,
    nextCalibration: '2026-05-22',
    calibrationStatus: '正常',
    pipePressure: 0.37,
    waterTemp: 17.9,
  },
  {
    code: 'W003',
    zone: '生活用水区',
    medium: '清水',
    installLocation: '员工宿舍进水支管',
    rangeSpec: '0~150 m³/h',
    protocol: 'NB-IoT',
    roomNo: '8410',
    status: 'online',
    instantFlow: 52.1,
    todayCumulative: 312.5,
    nextCalibration: '2026-04-10',
    calibrationStatus: '即将到期',
    pipePressure: 0.36,
    waterTemp: 18.0,
  },
  {
    code: 'W004',
    zone: '生活用水区',
    medium: '清水',
    installLocation: '食堂进水支管',
    rangeSpec: '0~100 m³/h',
    protocol: 'NB-IoT',
    roomNo: '8413',
    status: 'offline',
    instantFlow: 0,
    todayCumulative: 128.4,
    nextCalibration: '2026-01-10',
    calibrationStatus: '已过期',
    pipePressure: 0.32,
    waterTemp: 0,
  },
  {
    code: 'W005',
    zone: '绿化/外排',
    medium: '清水',
    installLocation: '绿化灌溉进水',
    rangeSpec: '0~80 m³/h',
    protocol: 'RS485',
    roomNo: '室外',
    status: 'online',
    instantFlow: 28.6,
    todayCumulative: 186.3,
    nextCalibration: '2026-08-01',
    calibrationStatus: '正常',
    pipePressure: 0.31,
    waterTemp: 16.5,
  },
  {
    code: 'W006',
    zone: '绿化/外排',
    medium: '污水',
    installLocation: '污水外排监测点',
    rangeSpec: '0~120 m³/h',
    protocol: 'Modbus',
    roomNo: '室外',
    status: 'online',
    instantFlow: 35.2,
    todayCumulative: 241.6,
    nextCalibration: '2026-07-15',
    calibrationStatus: '正常',
    pipePressure: 0.28,
    waterTemp: 15.2,
  },
];

export const mockHailinDevices: HailinMeterDevice[] = baseDevices.map((d) => ({
  ...d,
  id: `hailin-${d.code}`,
}));

export function getHailinDeviceById(id: string): HailinMeterDevice | undefined {
  return mockHailinDevices.find((d) => d.id === id);
}

export function getHailinDeviceByCode(code: string): HailinMeterDevice | undefined {
  return mockHailinDevices.find((d) => d.code === code);
}

export function getHailinRuntime(deviceId: string): HailinMeterRuntime | null {
  const device = getHailinDeviceById(deviceId);
  if (!device) return null;
  const offline = device.status === 'offline';
  const seed = parseInt(device.code.replace(/\D/g, ''), 10) || 1;
  const wave = Math.sin(Date.now() / 4000 + seed) * 0.08;

  const stdInstant = offline ? 0 : Math.round(6.73 * (1 + wave) * 100) / 100;
  const stdCumulative = offline ? 0 : Math.round((128767.14 + seed * 10) * 100) / 100;
  const instant = offline ? 0 : Math.round(6.73 * (1 + wave) * 100) / 100;
  const cumulative = offline ? 0 : Math.round((128767.14 + seed * 10) * 100) / 100;

  return {
    deviceId: device.id,
    deviceName: '能量表',
    room: device.roomNo,
    status: device.status,
    statusText: offline ? '离线' : '在线',
    updateTime: dayjs().format('YYYY-MM-DD'),
    stdCumulativeFlow: stdCumulative,
    stdInstantFlow: stdInstant,
    stdThermalPower: offline ? 0 : Math.round(24.34 * (1 + wave) * 100) / 100,
    stdCurrentHeat: offline ? 0 : 205980 + seed * 10,
    stdCurrentCold: offline ? 0 : 74180 + seed * 5,
    integratorFault: offline ? '异常' : '正常',
    inletTempSensor: offline ? '异常' : '正常',
    returnTempSensor: offline ? '异常' : '正常',
    flowSensor: offline ? '异常' : '正常',
    batteryVoltage: offline ? '' : '',
    cumulativeWorkHours: offline ? 0 : 51736 + seed * 120,
    returnWaterTemp: offline ? 0 : Math.round((11.6 + seed * 0.05) * 10) / 10,
    supplyWaterTemp: offline ? 0 : Math.round((14.91 + seed * 0.03) * 100) / 100,
    cumulativeFlowUnit: 'm³',
    cumulativeFlow: cumulative,
    instantFlowUnit: 'm³/h',
    instantFlow: instant,
    powerUnit: 'kW',
    thermalPower: offline ? 0 : Math.round(24 * (1 + wave)),
    heatUnit: 'MWh',
    currentHeat: offline ? 0 : Math.round((205.98 + seed * 0.1) * 100) / 100,
    coldUnit: 'MWh',
    currentCold: offline ? 0 : Math.round((74.18 + seed * 0.05) * 100) / 100,
  };
}

export const hailinNetworkTree: HailinNetworkNode[] = [
  {
    key: 'root-inlet',
    title: '厂区进水总管',
    children: [
      { key: 'hailin-W001', title: 'W001 · 在线', code: 'W001', status: 'online' },
    ],
  },
  {
    key: 'prod-zone',
    title: '生产用水区',
    children: [
      { key: 'hailin-W002', title: 'W002 车间1流量计', code: 'W002', status: 'online' },
      { key: 'hailin-W007', title: 'W007 车间2流量计', code: 'W007', status: 'online' },
    ],
  },
  {
    key: 'life-zone',
    title: '生活用水区',
    children: [
      { key: 'hailin-W003', title: 'W003 宿舍流量计', code: 'W003', status: 'online' },
      { key: 'hailin-W004', title: 'W004 厨房机房流量计', code: 'W004', status: 'offline' },
    ],
  },
  {
    key: 'green-zone',
    title: '绿化/外排',
    children: [
      { key: 'hailin-W005', title: 'W005 绿化流量计', code: 'W005', status: 'online' },
      { key: 'hailin-W006', title: 'W006 污水外排流量计', code: 'W006', status: 'online' },
    ],
  },
];

export const hailinDiagramNodes: HailinDiagramNode[] = [
  {
    deviceId: 'hailin-W001',
    code: 'W001',
    label: 'W001',
    subLabel: '在线 · 正常',
    x: 50,
    y: 22,
    status: 'online',
    instantFlow: 216,
    cumulativeFlow: 1285,
    nodeType: 'main',
  },
  {
    deviceId: 'hailin-W002',
    code: 'W002',
    label: '车间1',
    subLabel: 'W002',
    x: 22,
    y: 48,
    status: 'online',
    instantFlow: 78.5,
    cumulativeFlow: 456,
    nodeType: 'branch',
  },
  {
    deviceId: 'hailin-W007',
    code: 'W007',
    label: '车间2',
    subLabel: 'W007',
    x: 22,
    y: 74,
    status: 'online',
    instantFlow: 65.3,
    cumulativeFlow: 389,
    nodeType: 'terminal',
  },
  {
    deviceId: 'hailin-W003',
    code: 'W003',
    label: '员工宿舍',
    subLabel: 'W003',
    x: 50,
    y: 48,
    status: 'online',
    instantFlow: 52.1,
    cumulativeFlow: 312,
    nodeType: 'branch',
  },
  {
    deviceId: 'hailin-W004',
    code: 'W004',
    label: '厨房机房',
    subLabel: 'W004',
    x: 50,
    y: 74,
    status: 'offline',
    instantFlow: 0,
    cumulativeFlow: 128.4,
    nodeType: 'terminal',
  },
  {
    deviceId: 'hailin-W005',
    code: 'W005',
    label: '绿化用水',
    subLabel: 'W005',
    x: 78,
    y: 48,
    status: 'online',
    instantFlow: 28.6,
    cumulativeFlow: 186,
    nodeType: 'branch',
  },
  {
    deviceId: 'hailin-W006',
    code: 'W006',
    label: '污水外排',
    subLabel: 'W006',
    x: 78,
    y: 74,
    status: 'online',
    instantFlow: 35.2,
    cumulativeFlow: 242,
    nodeType: 'terminal',
  },
];

export const hailinPipeSegments: HailinPipeSegment[] = [
  { x1: 50, y1: 10, x2: 50, y2: 22, pipeType: 'main' },
  { x1: 50, y1: 22, x2: 50, y2: 36, pipeType: 'main' },
  { x1: 22, y1: 36, x2: 78, y2: 36, pipeType: 'branch' },
  { x1: 22, y1: 36, x2: 22, y2: 48, pipeType: 'branch' },
  { x1: 22, y1: 48, x2: 22, y2: 74, pipeType: 'branch' },
  { x1: 50, y1: 36, x2: 50, y2: 48, pipeType: 'branch' },
  { x1: 50, y1: 48, x2: 50, y2: 74, pipeType: 'branch' },
  { x1: 78, y1: 36, x2: 78, y2: 48, pipeType: 'branch' },
  { x1: 78, y1: 48, x2: 78, y2: 74, pipeType: 'branch' },
];

const analysisCodes = ['W001', 'W002', 'W003', 'W004', 'W005', 'W006', 'W007'];

function buildHourlyRecords(): HailinHourlyRecord[] {
  const slots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
  return slots.map((timeSlot, i) => {
    const readings: HailinHourlyRecord['readings'] = {};
    analysisCodes.forEach((code, j) => {
      const device = getHailinDeviceByCode(code);
      if (!device || device.status === 'offline') {
        readings[code] = { instant: null, cumulative: null };
        return;
      }
      const base = device.instantFlow;
      readings[code] = {
        instant: Math.round((base * (0.85 + (i + j) * 0.02)) * 10) / 10,
        cumulative: Math.round((device.todayCumulative * (0.1 + i * 0.12 + j * 0.01)) * 10) / 10,
      };
    });
    return { id: `hr-${i}`, timeSlot, readings };
  });
}

export const mockHailinHourlyRecords: HailinHourlyRecord[] = buildHourlyRecords();

export function countHailinByStatus() {
  const online = mockHailinDevices.filter((d) => d.status === 'online').length;
  const offline = mockHailinDevices.filter((d) => d.status === 'offline').length;
  return { total: mockHailinDevices.length, online, offline };
}
