import type {
  AlarmEvent,
  EventPushConfig,
  NotificationConfig,
  RealTimeEvent,
} from '../types/security';
import {
  computeAlarmStats,
  isPushedAlarmEvent,
  toAlarmEvent,
} from '../types/security';
import { PUSH_TEMPLATE } from '../types/security';

const baseEvents: Omit<RealTimeEvent, 'id'>[] = [
  {
    device: '监控',
    location: '园区附属设施/1F/宣发区域',
    sourceName: '5Z-019-7、8号楼中庭监控',
    eventType: '监控设备离线报警',
    level: '中',
    status: '已处理',
    startTime: '2026-07-13 07:46:00',
    endTime: '2026-07-13 08:10:00',
    handleMode: 'workOrder',
    pushStatus: '已推送',
  },
  {
    device: '监控',
    location: '园区附属设施/2F/走廊',
    sourceName: '5Z-020-东侧通道监控',
    eventType: '监控设备离线报警',
    level: '中',
    status: '已处理',
    startTime: '2026-07-12 14:20:00',
    endTime: '2026-07-12 15:00:00',
    handleMode: 'workOrder',
    pushStatus: '已推送',
  },
  {
    device: '监控',
    location: '生物芯片/1号楼/1F101',
    sourceName: 'SZ-019-7、8号楼',
    eventType: '监控设备离线报警',
    level: '中',
    status: '未处理',
    startTime: '2026-07-11 09:15:00',
    endTime: '2026-07-11 09:15:00',
    handleMode: 'workOrder',
    pushStatus: '已推送',
  },
  {
    device: '监控',
    location: '生物芯片/2号楼/B1停车场',
    sourceName: 'PK-001-车场入口',
    eventType: '监控设备离线报警',
    level: '低',
    status: '未处理',
    startTime: '2026-07-10 16:30:00',
    endTime: '2026-07-10 16:30:00',
    handleMode: 'remind',
    pushStatus: '未推送',
  },
  {
    device: '门禁',
    location: '生物芯片/1号楼/大门',
    sourceName: 'MJ-001-主入口',
    eventType: '门禁异常开门',
    level: '高',
    status: '处理中',
    startTime: '2026-07-09 22:05:00',
    endTime: '2026-07-09 22:05:00',
    handleMode: 'workOrder',
    pushStatus: '已推送',
  },
  {
    device: '动环设备',
    location: '生物芯片/机房/1F',
    sourceName: '动环主机-01',
    eventType: '温度偏高',
    level: '高',
    status: '未处理',
    startTime: '2026-07-08 11:20:00',
    endTime: '2026-07-08 11:20:00',
    handleMode: 'remind',
    pushStatus: '未推送',
  },
  {
    device: '监控',
    location: '生物芯片/3号楼/顶楼',
    sourceName: 'MON-003-顶楼球机',
    eventType: '设备离线',
    level: '中',
    status: '未处理',
    startTime: '2026-07-07 08:00:00',
    endTime: '2026-07-07 08:00:00',
    handleMode: 'workOrder',
    pushStatus: '未推送',
  },
];

function genEvents(count: number): RealTimeEvent[] {
  return Array.from({ length: count }, (_, i) => {
    const base = baseEvents[i % baseEvents.length];
    const handleMode = i % 4 === 0 ? 'remind' : base.handleMode;
    const pushStatus =
      handleMode === 'remind'
        ? '未推送'
        : i % 7 === 0
          ? '未推送'
          : '已推送';
    const day = String(Math.max(1, 13 - (i % 13))).padStart(2, '0');
    return {
      ...base,
      id: String(i + 1),
      handleMode,
      pushStatus,
      startTime: base.startTime.replace(/-\d{2} /, `-${day} `),
      endTime: base.endTime.replace(/-\d{2} /, `-${day} `),
    };
  });
}

/** 全部实时事件 */
export const mockRealTimeEvents = genEvents(199);

/** 报警事件 = 已推送（已生成工单）的实时事件子集 */
export const mockAlarmEvents: AlarmEvent[] = mockRealTimeEvents
  .filter(isPushedAlarmEvent)
  .map((e, i) => toAlarmEvent(e, i));

export const alarmStatsSummary = computeAlarmStats(mockAlarmEvents);

export const mockEventPushConfigs: EventPushConfig[] = [
  {
    id: '1',
    device: '门禁',
    eventType: 'DOOR_FORCED_OPEN',
    eventTypeName: '门被外力开启',
    levelConfigs: [
      { id: 'lc1', level: '中', notifyMethod: '钉钉机器人', handleType: 'simple' },
      { id: 'lc2', level: '高', notifyMethod: '企业微信', handleType: 'remind' },
    ],
    effectiveTime: '永久有效',
    pushContent: PUSH_TEMPLATE,
    enabled: true,
    updater: '管理员',
  },
  {
    id: '2',
    device: '监控',
    eventType: 'DEVICE_OFFLINE',
    eventTypeName: '设备离线',
    levelConfigs: [
      { id: 'lc3', level: '低', notifyMethod: '钉钉机器人', handleType: 'simple' },
      { id: 'lc4', level: '中', notifyMethod: '钉钉机器人', handleType: 'simple' },
      { id: 'lc5', level: '高', notifyMethod: '企业微信', handleType: 'full' },
    ],
    effectiveTime: '2025-10-29 00:00 至 2025-11-24 00:00',
    pushContent: PUSH_TEMPLATE,
    enabled: true,
    updater: '管理员',
  },
  {
    id: '3',
    device: '道闸设备',
    eventType: 'GATE_ABNORMAL',
    eventTypeName: '道闸异常',
    levelConfigs: [
      { id: 'lc6', level: '低', notifyMethod: '钉钉机器人', handleType: 'simple' },
      { id: 'lc7', level: '中', notifyMethod: '钉钉机器人', handleType: 'simple' },
      { id: 'lc8', level: '高', notifyMethod: '钉钉机器人', handleType: 'simple' },
    ],
    effectiveTime: '永久有效',
    pushContent: PUSH_TEMPLATE,
    enabled: false,
    updater: '管理员',
  },
];

export const mockNotificationConfigs: NotificationConfig[] = [
  {
    id: '1',
    name: '测试环境门禁',
    type: '钉钉机器人',
    status: '良好',
    lastTestTime: '2025-11-03 17:35:02',
    updater: '管理员',
  },
];

export const levelProportion = [
  { name: '低', value: 5 },
  { name: '中', value: 190 },
  { name: '高', value: 6 },
];

export const categoryProportion = [
  { name: '视频', value: 201 },
  { name: '入侵报警', value: 0 },
  { name: '门禁', value: 0 },
  { name: '停车场', value: 0 },
  { name: '园区卡口', value: 0 },
  { name: '可视对讲', value: 0 },
  { name: '行车监控', value: 0 },
  { name: '梯控', value: 0 },
  { name: '动环', value: 0 },
  { name: '人脸监控', value: 0 },
  { name: '消防', value: 0 },
  { name: '紧急报警', value: 0 },
];

export const top5Events = [
  { rank: 1, category: '视频', count: 201 },
  { rank: 2, category: '入侵报警', count: 0 },
  { rank: 3, category: '门禁', count: 0 },
  { rank: 4, category: '停车场', count: 0 },
  { rank: 5, category: '园区卡口', count: 0 },
];

export const alarmTrendData = [
  { date: '2026-07-01', count: 12 },
  { date: '2026-07-02', count: 8 },
  { date: '2026-07-03', count: 15 },
  { date: '2026-07-04', count: 22 },
  { date: '2026-07-05', count: 168 },
  { date: '2026-07-06', count: 45 },
  { date: '2026-07-07', count: 18 },
  { date: '2026-07-08', count: 10 },
  { date: '2026-07-09', count: 25 },
  { date: '2026-07-10', count: 30 },
  { date: '2026-07-11', count: 55 },
  { date: '2026-07-12', count: 72 },
  { date: '2026-07-13', count: 28 },
  { date: '2026-07-14', count: 15 },
  { date: '2026-07-15', count: 8 },
  { date: '2026-07-16', count: 12 },
  { date: '2026-07-17', count: 6 },
  { date: '2026-07-18', count: 9 },
  { date: '2026-07-19', count: 11 },
  { date: '2026-07-20', count: 14 },
  { date: '2026-07-21', count: 7 },
  { date: '2026-07-22', count: 5 },
  { date: '2026-07-23', count: 8 },
  { date: '2026-07-24', count: 10 },
  { date: '2026-07-25', count: 6 },
  { date: '2026-07-26', count: 4 },
  { date: '2026-07-27', count: 9 },
  { date: '2026-07-28', count: 11 },
  { date: '2026-07-29', count: 8 },
];
