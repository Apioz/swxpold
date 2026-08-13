import type { Person } from '../types/personnel';
import type { AccessControlGroup, AccessControlPoint } from '../types/accessControl';
import type { DataNode } from 'antd/es/tree';

export function getGroupPersonIdsForDevice(
  deviceId: string,
  groups: AccessControlGroup[],
): string[] {
  const ids = new Set<string>();
  groups.forEach((group) => {
    if (group.doorPointIds.includes(deviceId)) {
      group.authorizedPersonIds.forEach((id) => ids.add(id));
    }
  });
  return [...ids];
}

/** 门禁点有效权限 = 本点直接授权 ∪ 所属门禁组授权 */
export function getEffectivePersonIds(
  point: AccessControlPoint,
  groups: AccessControlGroup[],
): string[] {
  const ids = new Set<string>(point.authorizedPersonIds);
  getGroupPersonIdsForDevice(point.deviceId, groups).forEach((id) => ids.add(id));
  return [...ids];
}

export function personMatchesKeyword(person: Person, keyword: string): boolean {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return true;
  return [
    person.name,
    person.employeeNo,
    person.company,
    person.department,
    person.cardNo,
    person.phone,
  ].some((field) => field.toLowerCase().includes(kw));
}

export function companyNodeKey(company: string): string {
  return `company:${company}`;
}

export function deptNodeKey(company: string, department: string): string {
  return `dept:${company}|${department}`;
}

export function isPersonNodeKey(key: string): boolean {
  return key.startsWith('p-');
}

export interface PersonnelTreeBuildResult {
  treeData: DataNode[];
  /** 搜索时建议展开的节点 */
  searchExpandedKeys: string[];
  /** 节点 key → 该节点下全部人员 ID（公司/部门/人员） */
  nodeToPersonIds: Map<string, string[]>;
  deptPersonIds: Map<string, string[]>;
  companyPersonIds: Map<string, string[]>;
}

export function buildPersonnelTreeData(
  personnel: Person[],
  keyword = '',
): PersonnelTreeBuildResult {
  const filtered = keyword.trim()
    ? personnel.filter((p) => personMatchesKeyword(p, keyword))
    : personnel;

  const companyMap = new Map<string, Map<string, Person[]>>();
  filtered.forEach((person) => {
    if (!companyMap.has(person.company)) {
      companyMap.set(person.company, new Map());
    }
    const deptMap = companyMap.get(person.company)!;
    if (!deptMap.has(person.department)) {
      deptMap.set(person.department, []);
    }
    deptMap.get(person.department)!.push(person);
  });

  const searchExpandedKeys: string[] = [];
  const nodeToPersonIds = new Map<string, string[]>();
  const deptPersonIds = new Map<string, string[]>();
  const companyPersonIds = new Map<string, string[]>();
  const treeData: DataNode[] = [];

  companyMap.forEach((deptMap, company) => {
    const cKey = companyNodeKey(company);
    searchExpandedKeys.push(cKey);

    const companyPersonIdList: string[] = [];
    const deptChildren: DataNode[] = [];

    deptMap.forEach((persons, department) => {
      const dKey = deptNodeKey(company, department);
      const personIds = persons.map((p) => p.id);
      searchExpandedKeys.push(dKey);
      deptPersonIds.set(dKey, personIds);
      nodeToPersonIds.set(dKey, personIds);
      companyPersonIdList.push(...personIds);
      personIds.forEach((id) => nodeToPersonIds.set(id, [id]));

      deptChildren.push({
        key: dKey,
        title: `${department}（${persons.length} 人）`,
        selectable: false,
        children: persons.map((person) => ({
          key: person.id,
          title: `${person.name}（${person.employeeNo}）`,
          isLeaf: true,
        })),
      });
    });

    companyPersonIds.set(cKey, companyPersonIdList);
    nodeToPersonIds.set(cKey, companyPersonIdList);

    treeData.push({
      key: cKey,
      title: `${company}（${companyPersonIdList.length} 人）`,
      selectable: false,
      children: deptChildren,
    });
  });

  return { treeData, searchExpandedKeys, nodeToPersonIds, deptPersonIds, companyPersonIds };
}

/** 根据已选人员计算树勾选态（含部门/公司全选、半选） */
export function computeTreeCheckedKeys(
  selectedPersonIds: string[],
  deptPersonIds: Map<string, string[]>,
  companyPersonIds: Map<string, string[]>,
): { checked: string[]; halfChecked: string[] } {
  const selected = new Set(selectedPersonIds);
  const checked = new Set<string>(selectedPersonIds);
  const halfChecked = new Set<string>();

  deptPersonIds.forEach((personIds, deptKey) => {
    const selectedCount = personIds.filter((id) => selected.has(id)).length;
    if (selectedCount === personIds.length && personIds.length > 0) {
      checked.add(deptKey);
    } else if (selectedCount > 0) {
      halfChecked.add(deptKey);
    }
  });

  companyPersonIds.forEach((personIds, companyKey) => {
    const selectedCount = personIds.filter((id) => selected.has(id)).length;
    if (selectedCount === personIds.length && personIds.length > 0) {
      checked.add(companyKey);
    } else if (selectedCount > 0) {
      halfChecked.add(companyKey);
    }
  });

  return { checked: [...checked], halfChecked: [...halfChecked] };
}

/** 从树勾选 key 解析出人员 ID */
export function resolvePersonIdsFromCheckedKeys(
  keys: string[],
  nodeToPersonIds: Map<string, string[]>,
): string[] {
  const personIds = new Set<string>();
  keys.forEach((key) => {
    if (isPersonNodeKey(key)) {
      personIds.add(key);
      return;
    }
    nodeToPersonIds.get(key)?.forEach((id) => personIds.add(id));
  });
  return [...personIds];
}
