import { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Modal, Select, Space, Table } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { type Dayjs } from 'dayjs';
import type { FlowMeterDevice } from '../../types/innovationCenter';
import type { FlowMeterReadingItem } from '../../types/innovationCenter';
import {
  defaultAnchor,
  defaultSlotIndex,
  resolveReadingData,
  shiftPeriod,
} from '../../data/flowMeterReadingData';
import {
  formatReadingDisplay,
  getFlowMeterRuntime,
  isNumericReading,
  type FlowMeterDataAgg,
  type FlowMeterDataInterval,
} from '../../data/mockFlowMeterRuntime';
import './InnovationCenter.css';

interface FlowMeterDataChartModalProps {
  device: FlowMeterDevice | null;
  open: boolean;
  onClose: () => void;
}

const INTERVAL_OPTIONS: FlowMeterDataInterval[] = ['实时', '时', '日', '月', '年'];
const AGG_OPTIONS: FlowMeterDataAgg[] = ['采样值', '最大值', '最小值', '平均值'];

function pickerMode(interval: FlowMeterDataInterval): 'date' | 'month' | 'year' | undefined {
  if (interval === '时' || interval === '日') return 'date';
  if (interval === '月' || interval === '年') return 'year';
  return undefined;
}

function normalizeAnchor(interval: FlowMeterDataInterval, value: Dayjs): Dayjs {
  if (interval === '时') return value.startOf('day');
  if (interval === '日') return value.startOf('month');
  if (interval === '月' || interval === '年') return value.startOf('year');
  return value;
}

function encodeStringValue(value: string, readingKey: string): number {
  const map: Record<string, Record<string, number>> = {
    door: { 开启: 1, 关闭: 0 },
    lock: { 已上锁: 1, 未上锁: 0 },
    stream: { 正常: 1, 异常: 0 },
    screen: { 显示中: 1, 待机: 0 },
    status: { 正常: 1, 异常: 0, 离线: 0 },
    resolution: { '1920×1080': 1, '1280×720': 0.5 },
  };
  return map[readingKey]?.[value] ?? 0.5;
}

function chartValues(
  reading: FlowMeterReadingItem,
  slots: { label: string; value: number | string; isFuture: boolean }[],
): number[] {
  const numeric = isNumericReading(reading);
  return slots.map((s) => {
    if (s.isFuture) return 0;
    if (numeric) return s.value as number;
    if (s.value === '--') return 0;
    return encodeStringValue(String(s.value), reading.key);
  });
}

function buildChartOption(
  reading: FlowMeterReadingItem,
  slots: { label: string; value: number | string; isFuture: boolean }[],
) {
  const numeric = isNumericReading(reading);
  const unit = reading.unit ?? '';
  const color = reading.accent ?? '#1890ff';
  const values = chartValues(reading, slots);
  const labels = slots.map((s) => s.label);

  return {
    color: [color],
    grid: { left: 56, right: 24, top: 36, bottom: 48 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: { dataIndex: number }[]) => {
        const idx = params[0]?.dataIndex ?? 0;
        const slot = slots[idx];
        if (!slot) return '';
        if (slot.isFuture) return `${slot.label}<br/>未到时段`;
        if (numeric) {
          return `${slot.label}<br/>${reading.label}: ${slot.value}${unit ? ` ${unit}` : ''}`;
        }
        return `${slot.label}<br/>${reading.label}: ${slot.value}`;
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: '#d9d9d9' } },
      axisLabel: { color: 'rgba(0, 0, 0, 0.45)', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: numeric ? unit : undefined,
      min: numeric ? undefined : 0,
      max: numeric ? undefined : 1.2,
      show: numeric,
      nameTextStyle: { color: 'rgba(0, 0, 0, 0.45)', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
      axisLabel: { color: 'rgba(0, 0, 0, 0.45)', fontSize: 11 },
    },
    series: [
      {
        name: reading.label,
        type: 'line',
        smooth: numeric,
        step: numeric ? false : 'end',
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2 },
        areaStyle: numeric ? { color: `${color}22` } : undefined,
        data: values,
      },
    ],
    legend: {
      bottom: 0,
      data: [reading.label],
      icon: 'circle',
    },
  };
}

function buildDataTable(
  reading: FlowMeterReadingItem,
  data: ReturnType<typeof resolveReadingData>,
) {
  const { slots, summary } = data;
  if (!slots.length) return null;

  const numeric = isNumericReading(reading);
  const unit = reading.unit ?? '';
  const name = unit ? `${reading.label}(${unit})` : reading.label;

  const row: Record<string, string> = {
    key: reading.key,
    name,
    maxVal: summary.maxValue,
    maxTime: summary.maxTime,
    minVal: summary.minValue,
    minTime: summary.minTime,
  };

  slots.forEach((s) => {
    if (s.isFuture) {
      row[s.label] = numeric ? '0' : '--';
    } else {
      row[s.label] = String(s.value);
    }
  });

  const columns = [
    { title: '测量量名称', dataIndex: 'name', width: 130, fixed: 'left' as const },
    {
      title: '最大值',
      children: [
        { title: '数值', dataIndex: 'maxVal', width: 80, align: 'center' as const },
        { title: '时间点', dataIndex: 'maxTime', width: 80, align: 'center' as const },
      ],
    },
    {
      title: '最小值',
      children: [
        { title: '数值', dataIndex: 'minVal', width: 80, align: 'center' as const },
        { title: '时间点', dataIndex: 'minTime', width: 80, align: 'center' as const },
      ],
    },
    ...slots.map((s) => ({
      title: s.label,
      dataIndex: s.label,
      width: 72,
      align: 'center' as const,
    })),
  ];

  return { columns, dataSource: [row] };
}

export default function FlowMeterDataChartModal({
  device,
  open,
  onClose,
}: FlowMeterDataChartModalProps) {
  const [dataInterval, setDataInterval] = useState<FlowMeterDataInterval>('实时');
  const [agg, setAgg] = useState<FlowMeterDataAgg>('采样值');
  const [anchorDate, setAnchorDate] = useState(() => defaultAnchor('实时'));
  const [slotIndex, setSlotIndex] = useState(0);
  const [activeKey, setActiveKey] = useState('');
  const [queryTick, setQueryTick] = useState(0);
  const [runtime, setRuntime] = useState(() =>
    device ? getFlowMeterRuntime(device) : null,
  );

  useEffect(() => {
    if (!device) return;
    const next = getFlowMeterRuntime(device);
    setRuntime(next);
    setActiveKey(next.readings[0]?.key ?? '');
    setDataInterval('实时');
    setAgg('采样值');
    const anchor = defaultAnchor('实时');
    setAnchorDate(anchor);
    setSlotIndex(defaultSlotIndex('实时', anchor));
    setQueryTick(0);
  }, [device]);

  useEffect(() => {
    if (!device || !open) return;
    const timer = setInterval(() => setRuntime(getFlowMeterRuntime(device)), 3000);
    return () => clearInterval(timer);
  }, [device, open]);

  const readings = runtime?.readings ?? [];
  const activeReading = readings.find((r) => r.key === activeKey) ?? readings[0];

  const readingData = useMemo(() => {
    if (!device || !activeReading) {
      return {
        slots: [],
        summary: { maxValue: '--', maxTime: '--', minValue: '--', minTime: '--' },
        periodLabel: '',
      };
    }
    return resolveReadingData(
      device,
      activeReading,
      dataInterval,
      anchorDate,
      slotIndex,
      agg,
    );
  }, [device, activeReading, dataInterval, anchorDate, slotIndex, agg, queryTick]);

  const chartOption = useMemo(() => {
    if (!activeReading || !readingData.slots.length) return null;
    return buildChartOption(activeReading, readingData.slots);
  }, [activeReading, readingData]);

  const dataTable = useMemo(() => {
    if (!activeReading || dataInterval === '实时') return null;
    return buildDataTable(activeReading, readingData);
  }, [activeReading, readingData, dataInterval]);

  if (!device) return null;

  const showDatePicker = dataInterval !== '实时';
  const showAgg = dataInterval !== '实时';
  const showNav = dataInterval !== '实时';
  const currentDisplay = activeReading
    ? formatReadingDisplay(activeReading)
    : '--';

  const handleIntervalChange = (v: FlowMeterDataInterval) => {
    const anchor = defaultAnchor(v);
    setDataInterval(v);
    setAgg('采样值');
    setAnchorDate(anchor);
    setSlotIndex(defaultSlotIndex(v, anchor));
  };

  const handleDateChange = (v: Dayjs) => {
    const normalized = normalizeAnchor(dataInterval, v);
    setAnchorDate(normalized);
    setSlotIndex(defaultSlotIndex(dataInterval, normalized));
  };

  const handleClear = () => {
    const anchor = defaultAnchor('实时');
    setDataInterval('实时');
    setAgg('采样值');
    setAnchorDate(anchor);
    setSlotIndex(defaultSlotIndex('实时', anchor));
    setQueryTick((t) => t + 1);
  };

  const handleShift = (delta: number) => {
    const next = shiftPeriod(dataInterval, anchorDate, slotIndex, delta);
    setAnchorDate(next.anchor);
    setSlotIndex(next.slotIndex);
    setQueryTick((t) => t + 1);
  };

  return (
    <Modal
      title={device.name}
      open={open}
      onCancel={onClose}
      footer={null}
      width={980}
      centered
      destroyOnHidden
      className="flow-meter-chart-modal"
    >
      <div className="flow-meter-chart-tabs">
        {readings.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`flow-meter-chart-tab${activeKey === item.key ? ' active' : ''}`}
            onClick={() => setActiveKey(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flow-meter-chart-toolbar">
        <Space wrap size="middle">
          <span className="flow-meter-chart-toolbar-label">数据间隔:</span>
          <Select<FlowMeterDataInterval>
            value={dataInterval}
            style={{ width: 88 }}
            options={INTERVAL_OPTIONS.map((v) => ({ label: v, value: v }))}
            onChange={handleIntervalChange}
          />
          {showDatePicker && (
            <>
              <span className="flow-meter-chart-toolbar-label">时间:</span>
              <DatePicker
                value={anchorDate}
                picker={pickerMode(dataInterval)}
                allowClear={false}
                onChange={(v) => v && handleDateChange(v)}
              />
            </>
          )}
          {showAgg && (
            <>
              <span className="flow-meter-chart-toolbar-label">数据类型:</span>
              <Select<FlowMeterDataAgg>
                value={agg}
                style={{ width: 96 }}
                options={AGG_OPTIONS.map((v) => ({ label: v, value: v }))}
                onChange={setAgg}
              />
            </>
          )}
          <span className="flow-meter-chart-live-text">
            {device.name} 实时读数: {currentDisplay}
          </span>
          {showNav && (
            <span className="flow-meter-chart-period-text">
              当前时段: {readingData.periodLabel}
            </span>
          )}
        </Space>
        <Space>
          <Button type="primary" onClick={() => setQueryTick((t) => t + 1)}>
            查询
          </Button>
          <Button onClick={handleClear}>清空</Button>
          {showNav && (
            <>
              <Button icon={<LeftOutlined />} onClick={() => handleShift(-1)} />
              <Button icon={<RightOutlined />} onClick={() => handleShift(1)} />
            </>
          )}
        </Space>
      </div>

      <div className="flow-meter-chart-area">
        {chartOption ? (
          <ReactECharts option={chartOption} style={{ height: 320 }} notMerge lazyUpdate />
        ) : (
          <div className="flow-meter-chart-empty">暂无数据</div>
        )}
      </div>

      {dataTable && (
        <div className="flow-meter-chart-table-wrap">
          <Table
            size="small"
            bordered
            pagination={false}
            scroll={{ x: 'max-content' }}
            columns={dataTable.columns}
            dataSource={dataTable.dataSource}
          />
        </div>
      )}
    </Modal>
  );
}
