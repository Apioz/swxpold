import { useSyncExternalStore } from 'react';
import type { SparePart } from '../types/spareParts';
import { mockSpareParts } from '../data/mockSpareParts';
import { generateWarehouseStockCode } from '../utils/sparePartCode';

let spareParts: SparePart[] = structuredClone(mockSpareParts);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getSpareParts(): SparePart[] {
  return spareParts;
}

export function setSpareParts(next: SparePart[]) {
  spareParts = next;
  emit();
}

export function resetSpareParts() {
  spareParts = structuredClone(mockSpareParts);
  emit();
}

export function subscribeSpareParts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSparePartsStore(): [
  SparePart[],
  {
    setSpareParts: typeof setSpareParts;
    resetSpareParts: typeof resetSpareParts;
    applyInbound: typeof applyInbound;
  },
] {
  const data = useSyncExternalStore(subscribeSpareParts, getSpareParts, getSpareParts);
  return [data, { setSpareParts, resetSpareParts, applyInbound }];
}

/**
 * 入库：增加对应仓库库存；若该备件在该仓库尚无单仓库存编号则生成
 */
export function applyInbound(
  sparePartId: string,
  warehouseId: string,
  warehouseName: string,
  quantity: number,
): { stockCode: string } | null {
  const parts = spareParts;
  const idx = parts.findIndex((p) => p.id === sparePartId);
  if (idx < 0) return null;

  const part = parts[idx];
  const warehouses = [...part.warehouses];
  const wIdx = warehouses.findIndex((w) => w.warehouseId === warehouseId);
  let stockCode: string;

  if (wIdx >= 0) {
    const exist = warehouses[wIdx];
    stockCode =
      exist.stockCode ||
      generateWarehouseStockCode(parts, warehouseId, warehouseName);
    warehouses[wIdx] = {
      ...exist,
      quantity: exist.quantity + quantity,
      stockCode,
    };
  } else {
    stockCode = generateWarehouseStockCode(parts, warehouseId, warehouseName);
    warehouses.push({
      warehouseId,
      warehouseName,
      quantity,
      stockCode,
    });
  }

  const totalStock = warehouses.reduce((s, w) => s + w.quantity, 0);
  const next = [...parts];
  next[idx] = { ...part, warehouses, totalStock };
  setSpareParts(next);
  return { stockCode };
}
