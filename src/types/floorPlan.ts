/** 底座文件中心文档 */
export interface FileCenterDocument {
  id: string;
  /** 所属文件夹（楼栋） */
  folderName: string;
  /** 对应平面图楼层 ID，与楼层一一对应 */
  floorId: string;
  name: string;
  category: string;
  fileType: string;
  size: string;
  updatedAt: string;
  /** 预览用占位图或缩略图 */
  previewUrl: string;
}

/** 楼层图纸导入来源 */
export type FloorPlanImageSource = 'upload' | 'fileCenter';

/** 楼层图纸配置 */
export interface FloorPlanImageConfig {
  floorId: string;
  fileName: string;
  source: FloorPlanImageSource;
  imageUrl: string;
  fileCenterDocId?: string;
  importedAt: string;
}

/** 平面图设备点位（与设备关联） */
export interface FloorPlanPoint {
  id: string;
  floorId: string;
  deviceId: string;
  mapX: number;
  mapY: number;
  createdAt: string;
}
