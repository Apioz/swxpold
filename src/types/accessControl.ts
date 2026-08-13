/** 门禁权限组 */
export interface AccessControlGroup {
  id: string;
  /** 门禁组名称 */
  groupName: string;
  /** 说明 */
  description?: string;
  /** 关联门禁点设备 ID（来自门禁设备列表） */
  doorPointIds: string[];
  /** 授权人员 ID（来自人员管理列表，仅授权人员可通行） */
  authorizedPersonIds: string[];
  updater: string;
  updateTime: string;
}

/** 门禁点配置 */
export interface AccessControlPoint {
  id: string;
  /** 关联门禁设备 ID */
  deviceId: string;
  /** 门禁设备名称 */
  deviceName: string;
  /** 门禁点名称 */
  pointName: string;
  /** 安装位置 */
  installLocation: string;
  /** 设备编号 */
  deviceCode: string;
  /** 进出方向 */
  direction: AccessDirection;
  /** 是否启用 */
  enabled: boolean;
  /** 本门禁点直接授权人员（不含门禁组批量授权） */
  authorizedPersonIds: string[];
  remark?: string;
  updater: string;
  updateTime: string;
}

/** 门禁识别记录 */
export type AccessRecognitionResult = '通行成功' | '权限不足' | '黑名单';
export type AccessRecognitionType = '刷卡' | '人脸' | '二维码';
export type AccessDirection = '进' | '出';

export interface AccessRecognitionRecord {
  id: string;
  recordTime: string;
  personName: string;
  employeeNo: string;
  cardNo: string;
  doorName: string;
  doorCode: string;
  roomNo: string;
  recognitionType: AccessRecognitionType;
  result: AccessRecognitionResult;
  direction: AccessDirection;
}
