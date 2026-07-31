export interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  /** 单仓库存编号，入库到该仓库时生成，前缀为仓库名称首字母大写 */
  stockCode: string;
}

export interface RelatedEquipment {
  id: string;
  code: string;
  name: string;
  category: string;
  location: string;
}

export interface SparePart {
  id: string;
  code: string;
  name: string;
  spec: string;
  type: string;
  totalStock: number;
  warehouses: WarehouseStock[];
  price: number;
  unit: string;
  manufacturer: string;
  updater: string;
  updateTime: string;
  image?: string;
  relatedEquipment?: RelatedEquipment[];
}

export interface StockOrderItem {
  id: string;
  code: string;
  name: string;
  spec: string;
  type: string;
  totalStock: number;
  price: number;
  totalPrice: number;
  manufacturer: string;
  unit: string;
  quantity: number;
}

export interface InboundRecord {
  id: string;
  orderNo: string;
  type: string;
  warehouseId: string;
  warehouseName: string;
  person: string;
  time: string;
  quantity: number;
  unit: string;
  unitPrice: number | null;
  totalPrice: number | null;
  sparePartNames: string;
  sparePartCodes: string;
  spec: string;
  operator: string;
  operateTime: string;
  remark: string;
  items: StockOrderItem[];
}

export interface OutboundRecord {
  id: string;
  orderNo: string;
  type: string;
  warehouseId: string;
  warehouseName: string;
  person: string;
  time: string;
  quantity: number;
  unit: string;
  unitPrice: number | null;
  totalPrice: number | null;
  sparePartNames: string;
  sparePartCodes: string;
  spec: string;
  department: string;
  operateTime: string;
  remark: string;
  items: StockOrderItem[];
}

export const SPARE_PART_TYPES = ['通用备件', '电气备件', '机械备件', '耗材备件'] as const;

export const WAREHOUSES = [
  { id: 'wh1', name: '备品仓库' },
  { id: 'wh2', name: '物业总仓库' },
  { id: 'wh3', name: '消防仓库' },
] as const;

export const UNITS = ['件', '台', '个', '套', '箱', '米', '公斤', '条', '双'] as const;

export const PERSONS = ['管理员1', 'admin', '张三', '李四', '王五'] as const;

export const INBOUND_TYPES = ['采购入库', '维修入库', '退料入库', '调拨入库'] as const;

export const OUTBOUND_TYPES = ['领用出库', '维修出库', '调拨出库', '报废出库'] as const;

export const DEPARTMENTS = ['运维部', '实验部', '物业部', '工程部', '仓储部'] as const;
