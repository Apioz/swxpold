export type ProcessStatus = '未处理' | '处理中' | '已处理';
export type PushStatus = '已推送' | '未推送';
/** 事件处置方式：仅消息提醒不生成工单，工单推送需跟踪处置 */
export type EventHandleMode = 'remind' | 'workOrder';
export type EventLevel = '低' | '中' | '高';
export type EventCategory =
  | '视频'
  | '入侵报警'
  | '门禁'
  | '停车场'
  | '园区卡口'
  | '可视对讲'
  | '行车监控'
  | '梯控'
  | '动环'
  | '人脸监控'
  | '消防'
  | '紧急报警'
  | '监控'
  | '车闸'
  | '访客';

export interface RealTimeEvent {
  id: string;
  device: EventDevice;
  location: string;
  sourceName: string;
  eventType: string;
  level: EventLevel;
  status: ProcessStatus;
  startTime: string;
  endTime: string;
  /** 处置方式：仅消息提醒 / 工单推送 */
  handleMode: EventHandleMode;
  /** 已推送表示已生成工单并进入报警事件跟踪 */
  pushStatus: PushStatus;
}

export interface AlarmEvent extends RealTimeEvent {
  alarmContent: string;
  alarmTime: string;
  notifyPersons: string;
  /** 报警解决时间，未解决时为空 */
  resolvedTime: string;
  /** 工单编号，用于统计与跟踪处置 */
  workOrderNo: string;
}

export const EVENT_HANDLE_MODE_LABELS: Record<EventHandleMode, string> = {
  remind: '仅消息提醒',
  workOrder: '工单推送',
};

/** 是否已进入报警事件（已推送生成工单） */
export function isPushedAlarmEvent(event: RealTimeEvent): boolean {
  return event.pushStatus === '已推送';
}

export function toAlarmEvent(event: RealTimeEvent, index = 0): AlarmEvent {
  return {
    ...event,
    alarmContent: `${event.device}事件于${event.startTime}在${event.location}发生${event.eventType}，请核实并及时处理!`,
    alarmTime: event.startTime,
    notifyPersons: index % 3 === 0 ? '管理员' : '值班员',
    resolvedTime:
      event.status === '已处理' && event.endTime !== event.startTime
        ? event.endTime
        : '',
    workOrderNo: `WO${event.id.padStart(6, '0')}`,
  };
}

export function computeAlarmStats(events: AlarmEvent[]) {
  return {
    total: events.length,
    pending: events.filter((e) => e.status === '未处理').length,
    processing: events.filter((e) => e.status === '处理中').length,
    processed: events.filter((e) => e.status === '已处理').length,
    todayNew: events.filter((e) => e.alarmTime.startsWith('2026-07-13')).length,
  };
}

export type NotifyMethod = '钉钉机器人' | '企业微信';
export type NotificationType = NotifyMethod;
export type HandleType = 'simple' | 'full' | 'remind';

/** 触发报警事件的设备 */
export type EventDevice =
  | '门禁'
  | '门禁控制器'
  | '纯水流量计'
  | '压差计'
  | '电表'
  | '温湿度传感器'
  | '氧浓度'
  | 'PLC'
  | '暖通'
  | 'modbus网关'
  | '动环设备'
  | '低压设备'
  | '道闸设备'
  | '监控'
  | '视频'
  | '入侵报警'
  | '停车场'
  | '园区卡口'
  | '可视对讲'
  | '行车监控'
  | '梯控'
  | '动环'
  | '人脸监控'
  | '消防'
  | '紧急报警'
  | '车闸'
  | '访客';

/** 字典维护的事件类型，与接口事件类型一一对应 */
export interface EventTypeDictItem {
  code: string;
  name: string;
  device: EventDevice;
}

export interface LevelPushConfig {
  id: string;
  /** 不支持等级的设备为 null */
  level: EventLevel | null;
  notifyMethod: NotifyMethod;
  handleType: HandleType;
}

export interface EventPushConfig {
  id: string;
  device: EventDevice;
  eventType: string;
  eventTypeName: string;
  levelConfigs: LevelPushConfig[];
  effectiveTime: string;
  pushContent: string;
  enabled: boolean;
  updater: string;
}

export interface NotificationConfig {
  id: string;
  name: string;
  type: NotificationType;
  status: '良好' | '异常';
  lastTestTime: string;
  updater: string;
}

export const EVENT_CATEGORIES: EventCategory[] = [
  '视频',
  '入侵报警',
  '门禁',
  '停车场',
  '园区卡口',
  '可视对讲',
  '行车监控',
  '梯控',
  '动环',
  '人脸监控',
  '消防',
  '紧急报警',
  '监控',
  '车闸',
  '访客',
];

export const EVENT_LEVELS: EventLevel[] = ['低', '中', '高'];

export const PUSH_STATUSES: PushStatus[] = ['已推送', '未推送'];

/**
 * 事件推送配置 - 事件设备（按活动文档字段 + 补充项，已去重）
 * 门禁控制器→门禁，动环→动环设备，车闸→道闸设备，视频→监控
 */
export const EVENT_PUSH_DEVICES: EventDevice[] = [
  '门禁',
  '纯水流量计',
  '压差计',
  '电表',
  '温湿度传感器',
  '氧浓度',
  'PLC',
  '暖通',
  'modbus网关',
  '动环设备',
  '低压设备',
  '道闸设备',
  '监控',
];

export const EVENT_DEVICES: EventDevice[] = EVENT_PUSH_DEVICES;

/** 所有推送设备均支持低/中/高等级配置 */
export function deviceSupportsLevel(_device: EventDevice): boolean {
  return true;
}

export const PROCESS_STATUSES: ProcessStatus[] = ['未处理', '处理中', '已处理'];

function eventTypeEntries(
  device: EventDevice,
  items: readonly (readonly [string, string])[],
): EventTypeDictItem[] {
  return items.map(([code, name]) => ({ code, name, device }));
}

/** 事件类型字典（可维护，与接口 eventType 一一对应） */
export const EVENT_TYPE_DICT: EventTypeDictItem[] = [
  { code: 'DEVICE_OFFLINE', name: '设备离线', device: '监控' },
  ...eventTypeEntries('门禁', [
    ['DOOR_FORCED_OPEN', '门被外力开启'],
    ['READER_TAMPER_ALARM', '读卡器防拆报警'],
    ['READER_OFFLINE_ALARM', '读卡器掉线报警'],
    ['DEVICE_TAMPER_ALARM', '设备防拆报警'],
    ['DEVICE_OFFLINE', '装置离线'],
    ['DATA_CORRUPTED', '数据被损坏'],
    ['PASSWORD_ERROR', '密码错误'],
    ['CARD_NUMBER_ERROR', '输入卡号错误'],
    ['MULTI_AUTH_SUPER_PASSWORD_ERROR', '多重认证超级密码错误'],
    ['INTERLOCK_CANNOT_OPEN', '互锁中无法开门'],
    ['BLACKLIST_EVENT', '黑名单事件'],
    ['PERMISSION_MISMATCH', '权限不合'],
    ['CARD_AUTH_EXCEED_ALARM', '卡号认证超次报警'],
    ['DURESS_ALARM', '胁迫报警'],
  ]),
  ...eventTypeEntries('监控', [
    ['VIDEO_LOSS', '视频丢失'],
    ['VIDEO_OCCLUSION', '视频遮挡'],
    ['MOTION_DETECTION', '移动侦测'],
    ['SCENE_CHANGE', '场景变更'],
    ['DEFOCUS', '虚焦'],
    ['ALARM_INPUT', '报警输入'],
    ['FIELD_OF_VIEW_EVENT', '可视域事件'],
    ['GPS_COLLECTION', 'GPS采集'],
    ['AREA_INTRUSION', '区域入侵'],
    ['LINE_CROSSING', '越界侦测'],
    ['ENTER_AREA', '进入区域'],
    ['LEAVE_AREA', '离开区域'],
    ['LOITERING_DETECTION', '徘徊侦测'],
    ['PEOPLE_GATHERING', '人员聚集'],
    ['FAST_MOVEMENT', '快速移动'],
    ['PARKING_DETECTION', '停车侦测'],
    ['ABANDONED_OBJECT', '物品遗留'],
    ['OBJECT_REMOVAL', '物品拿取'],
  ]),
  ...eventTypeEntries('访客', [
    ['VISITOR_REGISTRATION', '访客登记'],
    ['VISITOR_SIGN_OUT', '访客签离'],
    ['VISITOR_APPOINTMENT_SUCCESS', '访客预约成功'],
    ['VISITOR_APPOINTMENT_REVIEW_RESULT', '访客预约审核结果'],
    ['VISITOR_PENDING_REVIEW', '访客待审核'],
    ['VISITOR_OVERDUE_NO_SIGNOUT', '访客超期未签离'],
    ['RESTRICTED_LIST_VISITOR_REGISTRATION', '受限名单访客登记'],
  ]),
  ...eventTypeEntries('动环设备', [
    ['DUST_HIGH', '扬尘偏高'],
    ['DUST_LOW', '扬尘偏低'],
    ['NOISE_LOW', '噪声偏低'],
    ['NOISE_HIGH', '噪声偏高'],
    ['PRESSURE_LOW', '压力偏低'],
    ['PRESSURE_HIGH', '压力偏高'],
    ['ABNORMAL_ALARM', '异常报警'],
    ['ALARM_INPUT_ALARM', '报警输入报警'],
    ['BATTERY_BACKUP_TIME_LOW', '电池备份时间偏低'],
    ['BATTERY_BACKUP_TIME_HIGH', '电池备份时间偏高'],
    ['LOAD_RATE_LOW', '负载率偏低'],
    ['LOAD_RATE_HIGH', '负载率偏高'],
    ['POWER_FACTOR_LOW', '功率因数偏低'],
    ['POWER_FACTOR_HIGH', '功率因数偏高'],
    ['PRECIPITATION_LOW', '降水量偏低'],
    ['PRECIPITATION_HIGH', '降水量偏高'],
    ['WATER_LEVEL_LOW', '水位偏低'],
    ['WATER_LEVEL_HIGH', '水位偏高'],
    ['GENERAL_ENV_LOW', '通用环境偏低'],
    ['GENERAL_ENV_HIGH', '通用环境偏高'],
    ['GAS_CONCENTRATION_LOW', '气体浓度偏低'],
    ['GAS_CONCENTRATION_HIGH', '气体浓度偏高'],
    ['VOLTAGE_LOW', '电压偏低'],
    ['VOLTAGE_HIGH', '电压偏高'],
    ['CURRENT_LOW', '电流偏低'],
    ['CURRENT_HIGH', '电流偏高'],
    ['FREQUENCY_LOW', '频率偏低'],
    ['FREQUENCY_HIGH', '频率偏高'],
    ['POWER_LOW', '功率偏低'],
    ['POWER_HIGH', '功率偏高'],
    ['FLOW_RATE_LOW', '流量偏低'],
    ['FLOW_RATE_HIGH', '流量偏高'],
    ['PRECIPITATION', '降水量'],
    ['PRESSURE', '压力'],
    ['WIND_DIRECTION', '风向'],
    ['DUST', '扬尘'],
    ['NOISE', '噪声'],
    ['WATER_LEVEL', '水位'],
    ['GENERAL_ENV_VOLUME', '通用环境量'],
    ['TEMPERATURE_LOW', '温度偏低'],
    ['TEMPERATURE_HIGH', '温度偏高'],
    ['HUMIDITY_LOW', '湿度偏低'],
    ['HUMIDITY_HIGH', '湿度偏高'],
    ['WIND_SPEED_LOW', '风速偏低'],
    ['WIND_SPEED_HIGH', '风速偏高'],
    ['TEMPERATURE_RT_DATA', '温度实时数据'],
    ['HUMIDITY_RT_DATA', '湿度实时数据'],
    ['WIND_SPEED_RT_DATA', '风速实时数据'],
    ['GAS_CONCENTRATION_RT_DATA', '气体浓度实时数据'],
    ['VOLTAGE_RT_DATA', '电压实时数据'],
    ['CURRENT_RT_DATA', '电流实时数据'],
    ['FREQUENCY_RT_DATA', '频率实时数据'],
    ['POWER_RT_DATA', '功率实时数据'],
    ['FLOW_RATE_RT_DATA', '流量实时数据'],
    ['BATTERY_BACKUP_TIME', '电池备份时间'],
    ['LOAD_RATE', '负载率'],
    ['POWER_FACTOR', '功率因数'],
  ]),
  { code: 'GATE_ABNORMAL', name: '道闸异常', device: '道闸设备' },
  { code: 'INTRUSION_ALARM', name: '入侵报警', device: '入侵报警' },
  { code: 'FIRE_ALARM', name: '消防报警', device: '消防' },
  { code: 'EMERGENCY_ALARM', name: '紧急报警', device: '紧急报警' },
];

export const ALL_NOTIFY_METHODS: NotifyMethod[] = ['钉钉机器人', '企业微信'];

/** @deprecated 使用 getConfiguredNotifyMethods + buildNotifyMethodOptions */
export const NOTIFY_METHODS: NotifyMethod[] = ALL_NOTIFY_METHODS;

export function getConfiguredNotifyMethods(
  configs: NotificationConfig[],
): NotifyMethod[] {
  const configured = new Set<NotifyMethod>();
  configs.forEach((item) => {
    if (ALL_NOTIFY_METHODS.includes(item.type as NotifyMethod)) {
      configured.add(item.type);
    }
  });
  return ALL_NOTIFY_METHODS.filter((method) => configured.has(method));
}

export function buildNotifyMethodOptions(configured: NotifyMethod[]) {
  return ALL_NOTIFY_METHODS.map((method) => ({
    label: method,
    value: method,
    disabled: !configured.includes(method),
  }));
}

export function getDefaultNotifyMethod(
  configured: NotifyMethod[],
): NotifyMethod {
  return configured[0] ?? ALL_NOTIFY_METHODS[0];
}

export function sanitizeNotifyMethod(
  method: NotifyMethod,
  configured: NotifyMethod[],
): NotifyMethod {
  if (configured.includes(method)) return method;
  return getDefaultNotifyMethod(configured);
}

export function isNotifyMethodUsedInPush(
  method: NotifyMethod,
  pushConfigs: EventPushConfig[],
): boolean {
  return pushConfigs.some((cfg) =>
    cfg.levelConfigs.some((lc) => lc.notifyMethod === method),
  );
}

export function getNotifyMethodDeleteBlockMessage(
  method: NotifyMethod,
): string {
  return `「${method}」已被事件推送配置引用，无法删除。请先在事件推送配置中取消使用该通知方式后再试。`;
}

export const HANDLE_TYPE_OPTIONS: { value: HandleType; label: string }[] = [
  { value: 'simple', label: '简易工单处理' },
  { value: 'full', label: '完整工单处理' },
  { value: 'remind', label: '仅消息提醒，无需工单' },
];

export const PUSH_TEMPLATE =
  '[事件设备] 于 {开始时间} 在 {所属位置} 发生 [事件类型] ，请核实并及时处理！';

export const PUSH_PREVIEW =
  '监控于2025年8月11日19:42:08在生物芯片1号楼1F101室发生设备离线，请核实并及时处理！';
