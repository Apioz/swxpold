import dayjs, { type Dayjs } from 'dayjs';
import type { FlowMeterDevice, FlowMeterReadingItem } from '../types/innovationCenter';
import type { FlowMeterDataAgg, FlowMeterDataInterval } from './mockFlowMeterRuntime';

export interface FlowMeterDataSlot {
  label: string;
  value: number | string;
  isFuture: boolean;
}

export interface FlowMeterReadingDataResult {
  slots: FlowMeterDataSlot[];
  summary: {
    maxValue: string;
    maxTime: string;
    minValue: string;
    minTime: string;
  };
  periodLabel: string;
}

export interface FlowMeterPeriodState {
  interval: FlowMeterDataInterval;
  anchor: Dayjs;
  slotIndex: number;
}

function hashSeed(device: FlowMeterDevice, readingKey: string, index: number): number {
  return device.indexNo * 31 + readingKey.length * 13 + index * 7;
}

function isNumericValue(value: number | string): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function sampleNumeric(
  device: FlowMeterDevice,
  reading: FlowMeterReadingItem,
  sampleIndex: number,
): number {
  const seed = hashSeed(device, reading.key, device.indexNo);
  const base = isNumericValue(reading.value) ? reading.value : 0;
  const range = Math.max(Math.abs(base) * 0.12, 0.5);
  const wave = Math.sin(sampleIndex * 0.85 + seed) * range * 0.55;
  const drift = Math.cos(sampleIndex * 0.35 + seed * 0.2) * range * 0.25;
  return Math.round((base + wave + drift) * 100) / 100;
}

function sampleString(
  device: FlowMeterDevice,
  readingKey: string,
  current: string,
  sampleIndex: number,
): string {
  if (readingKey === 'door') {
    return (sampleIndex + device.indexNo) % 5 === 0 ? '开启' : '关闭';
  }
  if (readingKey === 'screen') {
    return (sampleIndex + device.indexNo) % 6 === 0 ? '待机' : '显示中';
  }
  if (readingKey === 'status') {
    return (sampleIndex + device.indexNo) % 7 === 0 ? '异常' : '正常';
  }
  if (readingKey === 'last') {
    return dayjs().subtract((sampleIndex + device.indexNo) % 30, 'minute').format('HH:mm:ss');
  }
  return current;
}

function aggregateSamples(values: number[], agg: FlowMeterDataAgg): number {
  if (!values.length) return 0;
  if (agg === '采样值') return values[values.length - 1];
  if (agg === '最大值') return Math.max(...values);
  if (agg === '最小值') return Math.min(...values);
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

function secondaryAggregate(values: number[], agg: FlowMeterDataAgg): number {
  return aggregateSamples(values, agg);
}

function formatNum(v: number, unit: string): string {
  return unit ? `${v}${unit}` : String(v);
}

function buildSummary(
  slots: FlowMeterDataSlot[],
  numeric: boolean,
  unit: string,
): FlowMeterReadingDataResult['summary'] {
  if (!slots.length) {
    return { maxValue: '--', maxTime: '--', minValue: '--', minTime: '--' };
  }

  if (!numeric) {
    const valid = slots.filter((s) => !s.isFuture);
    const last = valid[valid.length - 1];
    const first = valid[0];
    return {
      maxValue: String(last?.value ?? '--'),
      maxTime: last?.label ?? '--',
      minValue: String(first?.value ?? '--'),
      minTime: first?.label ?? '--',
    };
  }

  let max = -Infinity;
  let min = Infinity;
  let maxVal = '--';
  let maxTime = '--';
  let minVal = '--';
  let minTime = '--';

  slots.forEach((s) => {
    if (s.isFuture) return;
    const v = s.value as number;
    if (v > max) {
      max = v;
      maxVal = formatNum(v, unit);
      maxTime = s.label;
    }
    if (v < min) {
      min = v;
      minVal = formatNum(v, unit);
      minTime = s.label;
    }
  });

  return { maxValue: maxVal, maxTime, minValue: minVal, minTime };
}

function isFutureSlot(slotEnd: Dayjs): boolean {
  return slotEnd.isAfter(dayjs());
}

function numericSlotValue(
  device: FlowMeterDevice,
  reading: FlowMeterReadingItem,
  sampleStart: number,
  sampleCount: number,
  agg: FlowMeterDataAgg,
): number {
  const samples: number[] = [];
  for (let i = 0; i < sampleCount; i += 1) {
    samples.push(sampleNumeric(device, reading, sampleStart + i));
  }
  return aggregateSamples(samples, agg);
}

function stringSlotValue(
  device: FlowMeterDevice,
  reading: FlowMeterReadingItem,
  sampleIndex: number,
): string {
  return sampleString(device, reading.key, String(reading.value), sampleIndex);
}

export function defaultSlotIndex(interval: FlowMeterDataInterval, anchor: Dayjs): number {
  const now = dayjs();
  if (interval === '实时') return 0;
  if (interval === '时') {
    if (anchor.isSame(now, 'day')) return now.hour();
    if (anchor.isAfter(now, 'day')) return 0;
    return 23;
  }
  if (interval === '日') {
    if (anchor.isSame(now, 'month')) return now.date() - 1;
    if (anchor.isAfter(now, 'month')) return 0;
    return anchor.daysInMonth() - 1;
  }
  if (interval === '月') {
    if (anchor.isSame(now, 'year')) return now.month();
    if (anchor.isAfter(now, 'year')) return 0;
    return 11;
  }
  const year = anchor.year();
  const start = year - 4;
  if (now.year() >= start && now.year() <= year) return now.year() - start;
  if (now.year() > year) return 4;
  return 0;
}

export function defaultAnchor(interval: FlowMeterDataInterval): Dayjs {
  const now = dayjs();
  if (interval === '时' || interval === '日') return now.startOf('day');
  if (interval === '月') return now.startOf('year');
  if (interval === '年') return now.startOf('year');
  return now;
}

export function shiftPeriod(
  interval: FlowMeterDataInterval,
  anchor: Dayjs,
  slotIndex: number,
  delta: number,
): { anchor: Dayjs; slotIndex: number } {
  if (interval === '实时') {
    return { anchor: dayjs(), slotIndex: 0 };
  }

  if (interval === '时') {
    let next = slotIndex + delta;
    let nextAnchor = anchor;
    while (next < 0) {
      nextAnchor = nextAnchor.subtract(1, 'day');
      next += 24;
    }
    while (next > 23) {
      nextAnchor = nextAnchor.add(1, 'day');
      next -= 24;
    }
    return { anchor: nextAnchor.startOf('day'), slotIndex: next };
  }

  if (interval === '日') {
    const days = anchor.daysInMonth();
    let next = slotIndex + delta;
    let nextAnchor = anchor;
    while (next < 0) {
      nextAnchor = nextAnchor.subtract(1, 'month').startOf('month');
      next += nextAnchor.daysInMonth();
    }
    while (next >= days) {
      next -= days;
      nextAnchor = nextAnchor.add(1, 'month').startOf('month');
    }
    return { anchor: nextAnchor.startOf('month'), slotIndex: next };
  }

  if (interval === '月') {
    let next = slotIndex + delta;
    let nextAnchor = anchor;
    while (next < 0) {
      nextAnchor = nextAnchor.subtract(1, 'year').startOf('year');
      next += 12;
    }
    while (next > 11) {
      nextAnchor = nextAnchor.add(1, 'year').startOf('year');
      next -= 12;
    }
    return { anchor: nextAnchor.startOf('year'), slotIndex: next };
  }

  let next = slotIndex + delta;
  let nextAnchor = anchor;
  while (next < 0) {
    nextAnchor = nextAnchor.subtract(5, 'year');
    next += 5;
  }
  while (next > 4) {
    nextAnchor = nextAnchor.add(5, 'year');
    next -= 5;
  }
  return { anchor: nextAnchor.startOf('year'), slotIndex: next };
}

export function periodLabel(
  interval: FlowMeterDataInterval,
  anchor: Dayjs,
  slotIndex: number,
): string {
  if (interval === '实时') return '最近15分钟';
  if (interval === '时') {
    const start = anchor.hour(slotIndex).minute(0);
    const end = start.add(1, 'hour');
    return `${start.format('HH:mm')}-${end.format('HH:mm')}`;
  }
  if (interval === '日') {
    return anchor.date(slotIndex + 1).format('YYYY-MM-DD');
  }
  if (interval === '月') {
    return anchor.month(slotIndex).format('YYYY-MM');
  }
  const year = anchor.year() - 4 + slotIndex;
  return `${year}年`;
}

export function getFlowMeterReadingData(
  device: FlowMeterDevice,
  reading: FlowMeterReadingItem,
  interval: FlowMeterDataInterval,
  anchor: Dayjs,
  slotIndex: number,
  agg: FlowMeterDataAgg,
): FlowMeterReadingDataResult {
  if (device.status === 'offline' || reading.value === '--') {
    return {
      slots: [],
      summary: { maxValue: '--', maxTime: '--', minValue: '--', minTime: '--' },
      periodLabel: periodLabel(interval, anchor, slotIndex),
    };
  }

  const numeric = isNumericValue(reading.value);
  const unit = reading.unit ?? '';
  const now = dayjs();

  if (interval === '实时') {
    const slots: FlowMeterDataSlot[] = [];
    for (let i = 0; i < 15; i += 1) {
      const t = now.subtract(14 - i, 'minute');
      const isFuture = t.isAfter(now);
      const label = t.format('HH:mm');
      if (numeric) {
        const v = isFuture ? 0 : sampleNumeric(device, reading, i);
        slots.push({ label, value: v, isFuture });
      } else {
        slots.push({
          label,
          value: isFuture ? '--' : stringSlotValue(device, reading, i),
          isFuture,
        });
      }
    }
    return {
      slots,
      summary: buildSummary(slots, numeric, unit),
      periodLabel: periodLabel(interval, anchor, slotIndex),
    };
  }

  if (interval === '时') {
    const slots: FlowMeterDataSlot[] = [];
    for (let m = 0; m < 60; m += 1) {
      const t = anchor.hour(slotIndex).minute(m);
      const end = t.add(1, 'minute');
      const isFuture = isFutureSlot(end);
      const label = t.format('HH:mm');
      if (numeric) {
        const v = isFuture ? 0 : numericSlotValue(device, reading, slotIndex * 60 + m, 1, agg);
        slots.push({ label, value: v, isFuture });
      } else {
        slots.push({
          label,
          value: isFuture ? '--' : stringSlotValue(device, reading, slotIndex * 60 + m),
          isFuture,
        });
      }
    }
    return {
      slots,
      summary: buildSummary(slots, numeric, unit),
      periodLabel: periodLabel(interval, anchor, slotIndex),
    };
  }

  if (interval === '日') {
    const slots: FlowMeterDataSlot[] = [];
    for (let h = 0; h < 24; h += 1) {
      const t = anchor.date(slotIndex + 1).hour(h);
      const end = t.add(1, 'hour');
      const isFuture = isFutureSlot(end);
      const label = `${String(h).padStart(2, '0')}:00`;
      if (numeric) {
        let v = 0;
        if (!isFuture) {
          const hourSamples: number[] = [];
          for (let m = 0; m < 60; m += 1) {
            hourSamples.push(sampleNumeric(device, reading, (slotIndex * 24 + h) * 60 + m));
          }
          v = aggregateSamples(hourSamples, agg);
        }
        slots.push({ label, value: v, isFuture });
      } else {
        slots.push({
          label,
          value: isFuture ? '--' : stringSlotValue(device, reading, slotIndex * 24 + h),
          isFuture,
        });
      }
    }
    return {
      slots,
      summary: buildSummary(slots, numeric, unit),
      periodLabel: periodLabel(interval, anchor, slotIndex),
    };
  }

  if (interval === '月') {
    const days = anchor.month(slotIndex).daysInMonth();
    const slots: FlowMeterDataSlot[] = [];
    for (let d = 0; d < days; d += 1) {
      const t = anchor.month(slotIndex).date(d + 1);
      const end = t.add(1, 'day');
      const isFuture = isFutureSlot(end);
      const label = `${String(d + 1).padStart(2, '0')}日`;
      if (numeric) {
        let v = 0;
        if (!isFuture) {
          const daySubAggs: number[] = [];
          for (let h = 0; h < 24; h += 1) {
            const hourSamples: number[] = [];
            for (let m = 0; m < 60; m += 1) {
              hourSamples.push(
                sampleNumeric(device, reading, (slotIndex * 31 + d) * 24 * 60 + h * 60 + m),
              );
            }
            daySubAggs.push(aggregateSamples(hourSamples, agg));
          }
          v = secondaryAggregate(daySubAggs, agg);
        }
        slots.push({ label, value: v, isFuture });
      } else {
        slots.push({
          label,
          value: isFuture ? '--' : stringSlotValue(device, reading, slotIndex * 31 + d),
          isFuture,
        });
      }
    }
    return {
      slots,
      summary: buildSummary(slots, numeric, unit),
      periodLabel: periodLabel(interval, anchor, slotIndex),
    };
  }

  const slots: FlowMeterDataSlot[] = [];
  const year = anchor.year() - 4 + slotIndex;
  for (let m = 0; m < 12; m += 1) {
    const t = dayjs().year(year).month(m).date(1);
    const end = t.add(1, 'month');
    const isFuture = isFutureSlot(end);
    const label = `${String(m + 1).padStart(2, '0')}月`;
    if (numeric) {
      let v = 0;
      if (!isFuture) {
        const monthSubAggs: number[] = [];
        const days = t.daysInMonth();
        for (let d = 0; d < days; d += 1) {
          const daySubAggs: number[] = [];
          for (let h = 0; h < 24; h += 1) {
            const hourSamples: number[] = [];
            for (let mi = 0; mi < 60; mi += 1) {
              hourSamples.push(
                sampleNumeric(device, reading, (slotIndex * 12 + m) * 31 * 24 * 60 + d * 24 * 60 + h * 60 + mi),
              );
            }
            daySubAggs.push(aggregateSamples(hourSamples, agg));
          }
          monthSubAggs.push(secondaryAggregate(daySubAggs, agg));
        }
        v = secondaryAggregate(monthSubAggs, agg);
      }
      slots.push({ label, value: v, isFuture });
    } else {
      slots.push({
        label,
        value: isFuture ? '--' : stringSlotValue(device, reading, slotIndex * 12 + m),
        isFuture,
      });
    }
  }

  return {
    slots,
    summary: buildSummary(slots, numeric, unit),
    periodLabel: periodLabel(interval, anchor, slotIndex),
  };
}

/** 年维度：展示选定年份的 12 个月份数据（二次统计） */
export function getFlowMeterYearMonthData(
  device: FlowMeterDevice,
  reading: FlowMeterReadingItem,
  anchor: Dayjs,
  slotIndex: number,
  agg: FlowMeterDataAgg,
): FlowMeterReadingDataResult {
  if (device.status === 'offline' || reading.value === '--') {
    return {
      slots: [],
      summary: { maxValue: '--', maxTime: '--', minValue: '--', minTime: '--' },
      periodLabel: periodLabel('年', anchor, slotIndex),
    };
  }

  const numeric = isNumericValue(reading.value);
  const unit = reading.unit ?? '';
  const year = anchor.year() - 4 + slotIndex;
  const yearStart = dayjs().year(year).startOf('year');
  const slots: FlowMeterDataSlot[] = [];

  for (let m = 0; m < 12; m += 1) {
    const t = yearStart.month(m).date(1);
    const end = t.add(1, 'month');
    const isFuture = isFutureSlot(end);
    const label = `${String(m + 1).padStart(2, '0')}月`;
    if (numeric) {
      let v = 0;
      if (!isFuture) {
        const monthData = getFlowMeterReadingData(
          device,
          reading,
          '月',
          yearStart,
          m,
          agg,
        );
        const vals = monthData.slots
          .filter((s) => !s.isFuture)
          .map((s) => s.value as number);
        v = vals.length ? secondaryAggregate(vals, agg) : 0;
      }
      slots.push({ label, value: v, isFuture });
    } else {
      slots.push({
        label,
        value: isFuture ? '--' : stringSlotValue(device, reading, slotIndex * 12 + m),
        isFuture,
      });
    }
  }

  return {
    slots,
    summary: buildSummary(slots, numeric, unit),
    periodLabel: periodLabel('年', anchor, slotIndex),
  };
}

export function resolveReadingData(
  device: FlowMeterDevice,
  reading: FlowMeterReadingItem,
  interval: FlowMeterDataInterval,
  anchor: Dayjs,
  slotIndex: number,
  agg: FlowMeterDataAgg,
): FlowMeterReadingDataResult {
  if (interval === '年') {
    return getFlowMeterYearMonthData(device, reading, anchor, slotIndex, agg);
  }
  return getFlowMeterReadingData(device, reading, interval, anchor, slotIndex, agg);
}
