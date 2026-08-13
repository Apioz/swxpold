import dayjs from 'dayjs';
import type {
  FacilityDeviceType,
  FlowMeterDevice,
  FlowMeterDeviceRuntime,
  FlowMeterReadingItem,
} from '../types/innovationCenter';

function jitter(base: number, range: number, seed: number): number {
  const wave = Math.sin(Date.now() / 3000 + seed) * range * 0.6;
  const noise = ((seed * 17) % 7) * (range * 0.08);
  return Math.round((base + wave + noise) * 100) / 100;
}

function numReading(
  key: string,
  label: string,
  base: number,
  range: number,
  unit: string,
  seed: number,
  accent?: string,
): FlowMeterReadingItem {
  return {
    key,
    label,
    value: jitter(base, range, seed),
    unit,
    accent,
  };
}

function readingsForType(
  device: FlowMeterDevice,
  offline: boolean,
): FlowMeterReadingItem[] {
  if (offline) {
    return getOfflineReadings(device.deviceType);
  }

  const s = device.indexNo;

  switch (device.deviceType) {
    case '纯水流量计':
      return [
        numReading('flow', '瞬时流量', 1.2 + (s % 8) * 0.35, 0.15, 'm³/h', s, '#1890ff'),
        numReading('total', '累计流量', 1200 + s * 48, 2.5, 'm³', s + 1, '#2f54eb'),
        numReading('pressure', '管道压力', 0.32 + (s % 5) * 0.04, 0.02, 'MPa', s + 2, '#722ed1'),
        numReading('temp', '水温', 18.5 + (s % 4), 0.8, '℃', s + 3, '#fa8c16'),
      ];
    case '压差计':
      return [
        numReading('diff', '压差值', 12 + (s % 6) * 2, 1.5, 'Pa', s, '#1890ff'),
        numReading('pos', '正压侧', 15 + (s % 4), 1.2, 'Pa', s + 1, '#52c41a'),
        numReading('neg', '负压侧', 3 + (s % 3), 0.8, 'Pa', s + 2, '#fa8c16'),
        numReading('alarm', '报警阈值', 25, 0, 'Pa', s + 3, '#eb2f96'),
      ];
    case '电表':
      return [
        numReading('voltage', '电压', 220 + (s % 5), 2, 'V', s, '#1890ff'),
        numReading('current', '电流', 8 + (s % 6) * 1.2, 0.5, 'A', s + 1, '#722ed1'),
        numReading('power', '有功功率', 1.5 + (s % 8) * 0.3, 0.2, 'kW', s + 2, '#fa8c16'),
        numReading('energy', '累计电量', 3200 + s * 120, 5, 'kWh', s + 3, '#52c41a'),
      ];
    case '温湿度传感器':
      return [
        numReading('temp', '温度', 22 + (s % 5) * 0.5, 0.6, '℃', s, '#fa8c16'),
        numReading('humid', '湿度', 45 + (s % 8) * 2, 3, '%RH', s + 1, '#13c2c2'),
        numReading('dew', '露点', 10 + (s % 4), 0.5, '℃', s + 2, '#722ed1'),
      ];
    case '氧浓度':
      return [
        numReading('o2', '氧浓度', 20.8 + (s % 3) * 0.1, 0.15, '%', s, '#52c41a'),
        numReading('temp', '环境温度', 23 + (s % 4) * 0.3, 0.5, '℃', s + 1, '#fa8c16'),
        numReading('pressure', '大气压', 101.3, 0.2, 'kPa', s + 2, '#1890ff'),
      ];
    case '门禁':
      return [
        {
          key: 'door',
          label: '门状态',
          value: s % 4 === 0 ? '开启' : '关闭',
          accent: s % 4 === 0 ? '#fa8c16' : '#52c41a',
        },
        {
          key: 'lock',
          label: '锁状态',
          value: '已上锁',
          accent: '#1890ff',
        },
        numReading('today', '今日通行', 12 + (s % 20), 3, '次', s + 1, '#722ed1'),
        {
          key: 'last',
          label: '最近通行',
          value: dayjs().subtract(s % 30, 'minute').format('HH:mm:ss'),
        },
      ];
    case '摄像头':
      return [
        {
          key: 'stream',
          label: '视频流',
          value: '正常',
          accent: '#52c41a',
        },
        numReading('fps', '帧率', 25, 1, 'fps', s, '#1890ff'),
        numReading('bitrate', '码率', 2048 + (s % 5) * 128, 64, 'kbps', s + 1, '#722ed1'),
        {
          key: 'resolution',
          label: '分辨率',
          value: '1920×1080',
        },
      ];
    case '会议屏':
      return [
        {
          key: 'screen',
          label: '屏幕状态',
          value: s % 5 === 0 ? '待机' : '显示中',
          accent: s % 5 === 0 ? '#fa8c16' : '#52c41a',
        },
        {
          key: 'status',
          label: '状态',
          value: s % 7 === 0 ? '异常' : '正常',
          accent: s % 7 === 0 ? '#ff4d4f' : '#52c41a',
        },
        numReading('cpu', 'CPU占用', 15 + (s % 10), 4, '%', s + 1, '#722ed1'),
        numReading('memory', '内存占用', 42 + (s % 15), 3, '%', s + 2, '#13c2c2'),
      ];
    case '门禁控制器':
      return [
        numReading('doors', '接入门数', 4 + (s % 3), 0, '扇', s, '#1890ff'),
        numReading('online', '在线门数', 3 + (s % 2), 0, '扇', s + 1, '#52c41a'),
        numReading('heartbeat', '心跳间隔', 30, 0, 's', s + 2, '#722ed1'),
        numReading('events', '今日事件', 8 + (s % 12), 2, '条', s + 3, '#fa8c16'),
      ];
    default:
      return [];
  }
}

function getOfflineReadings(type: FacilityDeviceType): FlowMeterReadingItem[] {
  const labels: Record<FacilityDeviceType, string[]> = {
    纯水流量计: ['瞬时流量', '累计流量', '管道压力', '水温'],
    压差计: ['压差值', '正压侧', '负压侧', '报警阈值'],
    电表: ['电压', '电流', '有功功率', '累计电量'],
    温湿度传感器: ['温度', '湿度', '露点'],
    氧浓度: ['氧浓度', '环境温度', '大气压'],
    门禁: ['门状态', '锁状态', '今日通行', '最近通行'],
    摄像头: ['视频流', '帧率', '码率', '分辨率'],
    会议屏: ['屏幕状态', '状态', 'CPU占用', '内存占用'],
    门禁控制器: ['接入门数', '在线门数', '心跳间隔', '今日事件'],
  };

  return labels[type].map((label, i) => ({
    key: `offline-${i}`,
    label,
    value: '--',
  }));
}

export function getFlowMeterRuntime(device: FlowMeterDevice): FlowMeterDeviceRuntime {
  const offline = device.status === 'offline';
  return {
    deviceId: device.id,
    updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    readings: readingsForType(device, offline),
  };
}

export type FlowMeterDataInterval = '实时' | '时' | '日' | '月' | '年';

export type FlowMeterDataAgg = '采样值' | '最大值' | '最小值' | '平均值';

export function isNumericReading(reading: FlowMeterReadingItem): boolean {
  return typeof reading.value === 'number' && !Number.isNaN(reading.value);
}

export function formatReadingDisplay(reading: FlowMeterReadingItem): string {
  if (reading.value === '--') return '--';
  if (reading.unit) return `${reading.value}${reading.unit}`;
  return String(reading.value);
}
