import {
  findFloorPlanNode,
  floorPlanDetails,
  getAllFloorNodes,
  walkFloorPlanTree,
} from '../data/mockFloorPlans';
import type { FloorPlanNode } from '../types/innovationCenter';

export interface FloorMatchTarget {
  floorId: string;
  floorTitle: string;
  buildingKey: string;
  buildingTitle: string;
  buildingFolderName: string;
  catalogPath: string;
}

/** 去掉扩展名后的文件名 */
export function stripFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/** 获取园区下全部楼层及其图纸目录路径 */
export function getAllFloorMatchTargets(): FloorMatchTarget[] {
  const targets: FloorMatchTarget[] = [];
  walkFloorPlanTree((node, parents) => {
    if (node.nodeType !== 'floor' || !node.floorId) return;
    const building = parents[parents.length - 1];
    const detail = floorPlanDetails[node.floorId];
    if (!building || !detail) return;
    targets.push({
      floorId: node.floorId,
      floorTitle: node.title,
      buildingKey: building.key,
      buildingTitle: building.title,
      buildingFolderName: detail.buildingName,
      catalogPath: `${building.title} / ${node.title}`,
    });
  });
  return targets;
}

/** 按楼栋 key 获取文件夹名称（与底座文件中心一致） */
export function getBuildingFolderName(buildingKey: string): string | undefined {
  const match = findFloorPlanNode(buildingKey);
  const firstFloor = match?.node.children?.find((c) => c.floorId);
  if (!firstFloor?.floorId) return undefined;
  return floorPlanDetails[firstFloor.floorId]?.buildingName;
}

/** 获取底座文件中心某楼栋文件夹下的楼层目录名列表 */
export function getFloorTitlesByBuildingKey(buildingKey: string): string[] {
  const match = findFloorPlanNode(buildingKey);
  return (match?.node.children ?? [])
    .filter((n) => n.nodeType === 'floor')
    .map((n) => n.title);
}

export interface FileMatchResult {
  fileName: string;
  matched: boolean;
  target?: FloorMatchTarget;
  reason?: string;
}

/**
 * 将上传文件名匹配到楼层图纸目录。
 * 园区批量：文件名须为 `{楼栋}-{楼层目录名}` 或 `{文件夹名}-{楼层目录名}`。
 * 文件夹内批量：文件名须与楼层目录名完全一致（不含扩展名）。
 */
export function matchUploadFileToFloor(
  fileName: string,
  scope: 'campus' | 'building',
  buildingKey?: string,
): FileMatchResult {
  const stem = stripFileExtension(fileName);
  const allTargets = getAllFloorMatchTargets();
  const scoped =
    scope === 'building' && buildingKey
      ? allTargets.filter((t) => t.buildingKey === buildingKey)
      : allTargets;

  // 文件夹内：文件名 = 楼层目录名
  const exact = scoped.find((t) => t.floorTitle === stem);
  if (exact) {
    return { fileName, matched: true, target: exact };
  }

  // 园区：楼栋-楼层
  const byDash = scoped.find(
    (t) => stem === `${t.buildingTitle}-${t.floorTitle}` || stem === `${t.buildingFolderName}-${t.floorTitle}`,
  );
  if (byDash) {
    return { fileName, matched: true, target: byDash };
  }

  if (scope === 'campus') {
    const floorOnly = allTargets.filter((t) => t.floorTitle === stem);
    if (floorOnly.length > 1) {
      return {
        fileName,
        matched: false,
        reason: `「${stem}」对应多个楼栋，请使用「8号楼-一楼」或「生物芯片智慧园区8号楼-一楼」格式`,
      };
    }
  }

  return {
    fileName,
    matched: false,
    reason: scope === 'campus'
      ? `未匹配到图纸目录，请使用「8号楼-一楼」格式，或与目录名完全一致`
      : `文件名「${stem}」与当前楼栋图纸目录不一致`,
  };
}

/** 按楼栋分组楼层节点 */
export function getBuildingFloorGroups(): Array<{
  buildingKey: string;
  buildingTitle: string;
  folderName: string;
  floors: FloorPlanNode[];
}> {
  const campus = findFloorPlanNode('campus-biochip');
  const buildings = campus?.node.children ?? [];
  return buildings.map((b) => ({
    buildingKey: b.key,
    buildingTitle: b.title,
    folderName: getBuildingFolderName(b.key) ?? b.title,
    floors: (b.children ?? []).filter((f) => f.nodeType === 'floor' && f.floorId),
  }));
}

export function countCampusFloors(): number {
  return getAllFloorNodes().length;
}
