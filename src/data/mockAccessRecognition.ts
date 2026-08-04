import type { AccessRecognitionRecord } from '../types/accessRecognition';
import { getDevicesByType } from './mockFlowMeters';
import { mockPersonnel } from './mockPersonnel';

const recognitionTypes: AccessRecognitionRecord['recognitionType'][] = ['人脸', '刷卡', '二维码'];

function buildRecords(): AccessRecognitionRecord[] {
  const doors = getDevicesByType('门禁').slice(0, 12);
  const persons = mockPersonnel.filter((p) => p.status === '在职');
  const records: AccessRecognitionRecord[] = [];
  let seq = 1;

  const baseTime = new Date('2026-08-03T09:00:00');

  for (let i = 0; i < 40; i++) {
    const door = doors[i % doors.length];
    const person = persons[i % persons.length];
    const denied = i % 7 === 0;
    const t = new Date(baseTime.getTime() - i * 18 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');

    records.push({
      id: `acr-${seq++}`,
      recordTime: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`,
      personName: person.name,
      employeeNo: person.employeeNo,
      department: person.department,
      doorName: door.name,
      doorCode: door.code,
      roomNo: door.roomNo,
      recognitionType: recognitionTypes[i % recognitionTypes.length],
      result: denied ? '拒绝' : '成功',
      denyReason: denied ? '无通行权限' : undefined,
    });
  }

  return records;
}

export const mockAccessRecognitionRecords: AccessRecognitionRecord[] = buildRecords();
