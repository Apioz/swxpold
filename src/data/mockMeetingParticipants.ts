export type ParticipantNodeType = 'company' | 'department' | 'person';

export interface ParticipantNode {
  id: string;
  name: string;
  type: ParticipantNodeType;
  children?: ParticipantNode[];
}

export interface MeetingParticipant {
  id: string;
  name: string;
  company: string;
  department: string;
}

const COMPANY_NAMES = [
  '上海临启生物科技有限公司',
  '上海伯豪生物技术有限公司',
  '上海佩格赛斯生物技术有限公司',
  '上海吉凯基因医学科技股份有限公司',
  '上海药明康德新药开发有限公司',
  '上海恒瑞医药研发中心',
  '上海复星医药创新实验室',
  '上海君实生物医药科技有限公司',
  '上海和黄医药研发总部',
  '上海信达生物制药研究院',
];

const DEPARTMENT_NAMES = ['研发部', '行政部', '市场部', '财务部', '人力资源部', '生产部', '质量部', '信息技术部'];

const PERSON_NAMES = [
  '叶婷', '姚瑜', '徐业飞', '洪媚', '邱虹', '张明', '李华', '王芳', '刘强', '陈静',
  '赵磊', '孙丽', '周杰', '吴敏', '郑涛', '冯雪', '朱伟', '秦芳', '许刚', '何静',
  '吕明', '施丽', '张伟', '孔芳', '曹杰', '严敏', '华涛', '金雪', '魏伟', '陶芳',
  '姜刚', '戚静', '谢明', '邹丽', '喻杰', '柏敏', '水涛', '窦雪', '章伟', '云芳',
  '苏刚', '潘静', '葛明', '奚丽', '范杰', '彭敏', '郎涛', '鲁雪', '韦伟', '昌芳',
];

function buildMockTree(): ParticipantNode[] {
  let personIndex = 0;
  const companies: ParticipantNode[] = [];

  COMPANY_NAMES.forEach((companyName, companyIdx) => {
    const departments: ParticipantNode[] = [];
    const deptCount = 6 + (companyIdx % 3);

    for (let deptIdx = 0; deptIdx < deptCount; deptIdx += 1) {
      const deptName = DEPARTMENT_NAMES[deptIdx % DEPARTMENT_NAMES.length];
      const people: ParticipantNode[] = [];
      const peopleCount = 12 + ((companyIdx + deptIdx) % 5);

      for (let i = 0; i < peopleCount; i += 1) {
        const baseName = PERSON_NAMES[personIndex % PERSON_NAMES.length];
        const suffix = personIndex >= PERSON_NAMES.length ? `${Math.floor(personIndex / PERSON_NAMES.length) + 1}` : '';
        people.push({
          id: `person-${personIndex}`,
          name: `${baseName}${suffix}`,
          type: 'person',
        });
        personIndex += 1;
      }

      departments.push({
        id: `dept-${companyIdx}-${deptIdx}`,
        name: deptName,
        type: 'department',
        children: people,
      });
    }

    companies.push({
      id: `company-${companyIdx}`,
      name: companyName,
      type: 'company',
      children: departments,
    });
  });

  return companies;
}

export const meetingParticipantTree: ParticipantNode[] = buildMockTree();

export function countAllPersons(nodes: ParticipantNode[] = meetingParticipantTree): number {
  let count = 0;
  const walk = (list: ParticipantNode[]) => {
    list.forEach((node) => {
      if (node.type === 'person') count += 1;
      if (node.children) walk(node.children);
    });
  };
  walk(nodes);
  return count;
}

export function collectPersons(nodes: ParticipantNode[]): MeetingParticipant[] {
  const result: MeetingParticipant[] = [];

  const walk = (list: ParticipantNode[], company = '', department = '') => {
    list.forEach((node) => {
      if (node.type === 'company') {
        walk(node.children ?? [], node.name, '');
      } else if (node.type === 'department') {
        walk(node.children ?? [], company, node.name);
      } else {
        result.push({ id: node.id, name: node.name, company, department });
      }
    });
  };

  walk(nodes);
  return result;
}

export function getPersonIdsUnderNode(node: ParticipantNode): string[] {
  if (node.type === 'person') return [node.id];
  return (node.children ?? []).flatMap(getPersonIdsUnderNode);
}

export function filterParticipantTree(
  nodes: ParticipantNode[],
  keyword: string,
): ParticipantNode[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return nodes;

  const filterNode = (node: ParticipantNode): ParticipantNode | null => {
    if (node.type === 'person') {
      return node.name.toLowerCase().includes(q) ? node : null;
    }

    const children = (node.children ?? [])
      .map(filterNode)
      .filter((child): child is ParticipantNode => child !== null);

    if (children.length === 0) return null;
    return { ...node, children };
  };

  return nodes
    .map(filterNode)
    .filter((node): node is ParticipantNode => node !== null);
}

export function getParticipantById(id: string): MeetingParticipant | undefined {
  return collectPersons(meetingParticipantTree).find((p) => p.id === id);
}
