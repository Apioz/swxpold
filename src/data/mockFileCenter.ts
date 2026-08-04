import {
  getBuildingFloorGroups,
  getBuildingFolderName,
} from '../utils/floorPlanImportMatch';
import type { FileCenterDocument } from '../types/floorPlan';

const previewGradients = [
  'linear-gradient(135deg, #e6f4ff 0%, #91caff 100%)',
  'linear-gradient(135deg, #f0f5ff 0%, #adc6ff 100%)',
  'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
  'linear-gradient(135deg, #f9f0ff 0%, #d3adf7 100%)',
  'linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)',
  'linear-gradient(135deg, #f6ffed 0%, #b7eb8f 100%)',
  'linear-gradient(135deg, #fff0f6 0%, #ffadd2 100%)',
  'linear-gradient(135deg, #e6fffb 0%, #87e8de 100%)',
];

/** 底座文件中心 — 按楼栋文件夹生成，图纸文件名与目录名一一对应 */
export const mockFileCenterDocuments: FileCenterDocument[] = (() => {
  const docs: FileCenterDocument[] = [];
  let gradientIdx = 0;

  getBuildingFloorGroups().forEach((group) => {
    group.floors.forEach((floor) => {
      if (!floor.floorId) return;
      docs.push({
        id: `fc-${floor.floorId}`,
        folderName: group.folderName,
        floorId: floor.floorId,
        /** 与图纸目录名称一致 */
        name: `${floor.title}.dwg`,
        category: floor.title === '楼顶' ? '设备图纸' : '建筑图纸',
        fileType: 'DWG',
        size: `${(1.5 + (gradientIdx % 5) * 0.3).toFixed(1)} MB`,
        updatedAt: '2026-07-15 10:00:00',
        previewUrl: previewGradients[gradientIdx % previewGradients.length],
      });
      gradientIdx += 1;
    });
  });

  return docs;
})();

export function getFileCenterDocument(id: string): FileCenterDocument | undefined {
  return mockFileCenterDocuments.find((d) => d.id === id);
}

/** 按楼层获取对应文件夹内图纸 */
export function getFileCenterDocumentsByFloor(floorId: string): FileCenterDocument[] {
  return mockFileCenterDocuments.filter((d) => d.floorId === floorId);
}

/** 按楼栋文件夹名获取全部图纸 */
export function getFileCenterDocumentsByFolder(folderName: string): FileCenterDocument[] {
  return mockFileCenterDocuments.filter((d) => d.folderName === folderName);
}

/** 按楼栋 key 获取文件夹内全部图纸 */
export function getFileCenterDocumentsByBuilding(buildingKey: string): FileCenterDocument[] {
  const folderName = getBuildingFolderName(buildingKey);
  if (!folderName) return [];
  return getFileCenterDocumentsByFolder(folderName);
}

/** 底座文件中心文件夹列表 */
export function getFileCenterFolders(): Array<{
  folderName: string;
  buildingKey: string;
  buildingTitle: string;
  documentCount: number;
}> {
  return getBuildingFloorGroups().map((g) => ({
    folderName: g.folderName,
    buildingKey: g.buildingKey,
    buildingTitle: g.buildingTitle,
    documentCount: getFileCenterDocumentsByFolder(g.folderName).length,
  }));
}
