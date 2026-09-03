export type DocumentNodeType = 'campus' | 'folder' | 'image';

export interface DocumentFloorMeta {
  campus: string;
  building: string;
  floor: string;
  floorPlanId: string;
}

export interface DocumentNode {
  id: string;
  name: string;
  type: DocumentNodeType;
  uploadDate?: string;
  url?: string;
  floorMeta?: DocumentFloorMeta;
  floorPlanUrl?: string;
  children?: DocumentNode[];
}

export interface SelectedDocumentImage {
  imageId: string;
  imageName: string;
  imageUrl: string;
  documentPath: string;
  campus: string;
  building: string;
  floor: string;
  floorPlanId: string;
  floorPlanUrl: string;
}

/** 从文档中心选择的楼层平面图 */
export interface SelectedFloorPlan {
  imageId: string;
  imageName: string;
  imageUrl: string;
  documentPath: string;
  campus: string;
  building: string;
  floor: string;
  floorPlanId: string;
}
