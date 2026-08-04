/** 门禁识别记录 */
export type AccessRecognitionType = '人脸' | '刷卡' | '二维码';
export type AccessRecognitionResult = '成功' | '拒绝';

export interface AccessRecognitionRecord {
  id: string;
  recordTime: string;
  personName: string;
  employeeNo: string;
  department: string;
  doorName: string;
  doorCode: string;
  roomNo: string;
  recognitionType: AccessRecognitionType;
  result: AccessRecognitionResult;
  denyReason?: string;
}
