import type { Person } from '../types/personnel';

/** 人员管理列表 mock 数据 */
export const mockPersonnel: Person[] = [
  { id: 'p-001', employeeNo: 'BIO001', name: '张三', company: '生物芯片科技有限公司', department: '研发部', phone: '13800001001', cardNo: 'C10086001', status: '在职' },
  { id: 'p-002', employeeNo: 'BIO002', name: '李四', company: '生物芯片科技有限公司', department: '研发部', phone: '13800001002', cardNo: 'C10086002', status: '在职' },
  { id: 'p-003', employeeNo: 'BIO003', name: '王五', company: '生物芯片科技有限公司', department: '实验中心', phone: '13800001003', cardNo: 'C10086003', status: '在职' },
  { id: 'p-004', employeeNo: 'BIO004', name: '赵六', company: '生物芯片科技有限公司', department: '实验中心', phone: '13800001004', cardNo: 'C10086004', status: '在职' },
  { id: 'p-005', employeeNo: 'BIO005', name: '钱七', company: '生物芯片科技有限公司', department: '行政部', phone: '13800001005', cardNo: 'C10086005', status: '在职' },
  { id: 'p-006', employeeNo: 'BIO006', name: '孙八', company: '生物芯片科技有限公司', department: '安保部', phone: '13800001006', cardNo: 'C10086006', status: '在职' },
  { id: 'p-007', employeeNo: 'BIO007', name: '周九', company: '生物芯片科技有限公司', department: '研发部', phone: '13800001007', cardNo: 'C10086007', status: '在职' },
  { id: 'p-008', employeeNo: 'BIO008', name: '吴十', company: '生物芯片科技有限公司', department: '质量部', phone: '13800001008', cardNo: 'C10086008', status: '在职' },
  { id: 'p-009', employeeNo: 'BIO009', name: '郑十一', company: '生物芯片科技有限公司', department: '实验中心', phone: '13800001009', cardNo: 'C10086009', status: '在职' },
  { id: 'p-010', employeeNo: 'BIO010', name: '管理员1', company: '生物芯片科技有限公司', department: '信息技术部', phone: '13800001010', cardNo: 'C10086010', status: '在职' },
  { id: 'p-011', employeeNo: 'BIO011', name: 'admin', company: '生物芯片科技有限公司', department: '信息技术部', phone: '13800001011', cardNo: 'C10086011', status: '在职' },
  { id: 'p-012', employeeNo: 'BIO012', name: '陈十二', company: '生物芯片科技有限公司', department: '研发部', phone: '13800001012', cardNo: 'C10086012', status: '离职' },
  { id: 'p-013', employeeNo: 'HL001', name: '林明', company: '海林能源科技', department: '运维部', phone: '13800001013', cardNo: 'C10086013', status: '在职' },
  { id: 'p-014', employeeNo: 'HL002', name: '黄伟', company: '海林能源科技', department: '工程部', phone: '13800001014', cardNo: 'C10086014', status: '在职' },
];

export function getActivePersonnel(): Person[] {
  return mockPersonnel.filter((p) => p.status === '在职');
}

export function getPersonById(id: string): Person | undefined {
  return mockPersonnel.find((p) => p.id === id);
}
