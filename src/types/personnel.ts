/** 人员管理 — 门禁权限配置从此列表选取人员 */
export type PersonStatus = '在职' | '离职';

export interface Person {
  id: string;
  employeeNo: string;
  name: string;
  department: string;
  phone: string;
  cardNo: string;
  status: PersonStatus;
}
