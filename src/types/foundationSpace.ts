export interface SpaceCenterRecord {
  id: string;
  name: string;
  code: string;
  category: string;
  elementId: string;
  relatedModel: string;
  usage: string;
  status: string;
  buildingArea: string;
  rentArea: string;
  unitPrice: string;
  totalPrice: string;
  usageUnit: string;
  completionDate: string;
  floor: string;
  createdAt: string;
  children?: SpaceCenterRecord[];
}

export interface SpaceCenterStats {
  unitTotal: number;
  spaceTotal: number;
  buildingAreaTotal: string;
  rentAreaTotal: string;
  costTotal: string;
}
