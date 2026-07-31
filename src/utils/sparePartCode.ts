import type { SparePart } from '../types/spareParts';
import { WAREHOUSES } from '../types/spareParts';

/** 仓库名称 → 单仓库存编号前缀（名称首位汉字拼音首字母大写） */
export const WAREHOUSE_CODE_PREFIX: Record<string, string> = {
  wh1: 'BP', // 备品仓库
  wh2: 'WY', // 物业总仓库
  wh3: 'XF', // 消防仓库
};

export function getWarehousePrefix(warehouseId: string, warehouseName?: string): string {
  if (WAREHOUSE_CODE_PREFIX[warehouseId]) {
    return WAREHOUSE_CODE_PREFIX[warehouseId];
  }
  if (warehouseName) {
    const mapped = WAREHOUSES.find((w) => w.name === warehouseName);
    if (mapped && WAREHOUSE_CODE_PREFIX[mapped.id]) {
      return WAREHOUSE_CODE_PREFIX[mapped.id];
    }
  }
  return 'CK';
}

function todayStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function nextSeq(existingCodes: string[], prefix: string, dateStamp: string): string {
  const fullPrefix = `${prefix}${dateStamp}`;
  let max = 0;
  for (const code of existingCodes) {
    if (!code.startsWith(fullPrefix)) continue;
    const seq = Number(code.slice(fullPrefix.length));
    if (!Number.isNaN(seq) && seq > max) max = seq;
  }
  return String(max + 1).padStart(4, '0');
}

/** 收集系统中已有编号（总库存 BJ + 各仓单仓库存编号） */
export function collectAllCodes(parts: SparePart[]): string[] {
  const codes: string[] = [];
  for (const p of parts) {
    codes.push(p.code);
    for (const w of p.warehouses) {
      if (w.stockCode) codes.push(w.stockCode);
    }
  }
  return codes;
}

/** 新增台账时生成总库存备件编号：BJ + yyyyMMdd + 流水号 */
export function generateBjCode(parts: SparePart[]): string {
  const stamp = todayStamp();
  const seq = nextSeq(collectAllCodes(parts), 'BJ', stamp);
  return `BJ${stamp}${seq}`;
}

/** 入库到某仓库时生成单仓库存编号：仓库前缀 + yyyyMMdd + 流水号 */
export function generateWarehouseStockCode(
  parts: SparePart[],
  warehouseId: string,
  warehouseName?: string,
): string {
  const prefix = getWarehousePrefix(warehouseId, warehouseName);
  const stamp = todayStamp();
  const seq = nextSeq(collectAllCodes(parts), prefix, stamp);
  return `${prefix}${stamp}${seq}`;
}

export function isBjCode(code: string): boolean {
  return code.trim().toUpperCase().startsWith('BJ');
}

export function isWarehouseStockCode(code: string): boolean {
  const c = code.trim().toUpperCase();
  if (!c || isBjCode(c)) return false;
  return Object.values(WAREHOUSE_CODE_PREFIX).some((p) => c.startsWith(p));
}

/** 判断编号是否匹配（支持完整/部分匹配） */
export function codeMatches(target: string, keyword: string): boolean {
  return target.toUpperCase().includes(keyword.trim().toUpperCase());
}

export type CodeSearchKind = 'bj' | 'warehouseStock' | 'none';

export function detectCodeSearchKind(keyword: string): CodeSearchKind {
  const k = keyword.trim();
  if (!k) return 'none';
  if (isBjCode(k)) return 'bj';
  if (isWarehouseStockCode(k)) return 'warehouseStock';
  // 未识别前缀时：若像编号则按模糊匹配，优先当作可能命中单仓/总仓
  return 'none';
}

export function findWarehouseIdsByStockCode(
  part: SparePart,
  keyword: string,
): string[] {
  return part.warehouses
    .filter((w) => w.stockCode && codeMatches(w.stockCode, keyword))
    .map((w) => w.warehouseId);
}
