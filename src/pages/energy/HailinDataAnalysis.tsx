import { useMemo, useState } from 'react';
import {
  Breadcrumb,
  Button,
  DatePicker,
  Radio,
  Select,
  Space,
  Table,
  Tabs,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { mockHailinDevices, mockHailinHourlyRecords } from '../../data/mockHailinMeters';
import './HailinMeter.css';

const analysisCodes = mockHailinDevices.map((d) => d.code);

export default function HailinDataAnalysis() {
  const [granularity, setGranularity] = useState('时');
  const [date, setDate] = useState(dayjs('2026-01-15'));
  const [meterFilter, setMeterFilter] = useState('全部');
  const [activeTab, setActiveTab] = useState('hourly');
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 7,
    total: 24,
    showTotal: (total) => `显示 1 到 7 条，共 ${total} 条记录`,
  });

  const columns: ColumnsType<(typeof mockHailinHourlyRecords)[number]> = useMemo(() => {
    const cols: ColumnsType<(typeof mockHailinHourlyRecords)[number]> = [
      { title: '时段', dataIndex: 'timeSlot', width: 80, fixed: 'left' },
    ];
    const codes = meterFilter === '全部' ? analysisCodes : [meterFilter];
    codes.forEach((code) => {
      cols.push({
        title: code,
        children: [
          {
            title: '瞬时',
            key: `${code}-instant`,
            width: 80,
            align: 'right',
            render: (_, record) => {
              const v = record.readings[code]?.instant;
              return v == null ? '-' : v.toFixed(1);
            },
          },
          {
            title: '累计',
            key: `${code}-cum`,
            width: 80,
            align: 'right',
            render: (_, record) => {
              const v = record.readings[code]?.cumulative;
              return v == null ? '-' : v.toFixed(1);
            },
          },
        ],
      });
    });
    return cols;
  }, [meterFilter]);

  const zoneSummary = useMemo(() => {
    const map = new Map<string, { instant: number; cumulative: number; count: number }>();
    mockHailinDevices.forEach((d) => {
      const cur = map.get(d.zone) ?? { instant: 0, cumulative: 0, count: 0 };
      map.set(d.zone, {
        instant: cur.instant + d.instantFlow,
        cumulative: cur.cumulative + d.todayCumulative,
        count: cur.count + 1,
      });
    });
    return [...map.entries()].map(([zone, v]) => ({
      id: zone,
      zone,
      deviceCount: v.count,
      totalInstant: v.instant.toFixed(1),
      totalCumulative: v.cumulative.toFixed(1),
      diffRate: `${(Math.random() * 3 + 1).toFixed(2)}%`,
    }));
  }, []);

  return (
    <div className="hailin-analysis-page">
      <div className="hailin-page-header hailin-analysis-page-header">
        <Breadcrumb items={[{ title: '数据分析' }, { title: '流量数据分析' }]} />
        <Button icon={<DownloadOutlined />}>导出报表</Button>
      </div>

      <div className="hailin-analysis-toolbar">
        <Space wrap size="middle">
          <span>时间维度：</span>
          <Radio.Group value={granularity} onChange={(e) => setGranularity(e.target.value)} optionType="button" buttonStyle="solid" options={['时', '日', '月', '年'].map((v) => ({ label: v, value: v }))} />
          <DatePicker value={date} onChange={(d) => d && setDate(d)} />
          <span>流量计：</span>
          <Select
            value={meterFilter}
            onChange={setMeterFilter}
            style={{ width: 160 }}
            options={[{ label: '全部流量计', value: '全部' }, ...analysisCodes.map((c) => ({ label: c, value: c }))]}
          />
          <Button type="primary" icon={<SearchOutlined />}>查询</Button>
        </Space>
      </div>

      <div className="hailin-panel">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'zone',
              label: '分区流量汇总表',
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={zoneSummary}
                  columns={[
                    { title: '所属分区', dataIndex: 'zone' },
                    { title: '设备数', dataIndex: 'deviceCount', width: 90 },
                    { title: '合计瞬时(m³/h)', dataIndex: 'totalInstant', width: 140 },
                    { title: '合计累计(m³)', dataIndex: 'totalCumulative', width: 140 },
                    { title: '产销差率', dataIndex: 'diffRate', width: 100 },
                  ]}
                />
              ),
            },
            {
              key: 'diff',
              label: '产销差损分析',
              children: (
                <Table
                  rowKey="zone"
                  size="small"
                  pagination={false}
                  dataSource={zoneSummary}
                  columns={[
                    { title: '分区', dataIndex: 'zone' },
                    { title: '供水量(m³)', dataIndex: 'totalCumulative' },
                    { title: '售水量(m³)', render: (_, r) => (parseFloat(r.totalCumulative) * 0.97).toFixed(1) },
                    { title: '差损量(m³)', render: (_, r) => (parseFloat(r.totalCumulative) * 0.03).toFixed(1) },
                    { title: '差损率', dataIndex: 'diffRate' },
                  ]}
                />
              ),
            },
            {
              key: 'hourly',
              label: '分时流量明细',
              children: (
                <>
                  <div className="hailin-analysis-table-head">
                    <span>分时流量明细 · {date.format('YYYY-MM-DD')} · {meterFilter === '全部' ? '全部流量计' : meterFilter}</span>
                    <Button type="link" icon={<DownloadOutlined />} style={{ color: '#52c41a' }}>导出 Excel</Button>
                  </div>
                  <Table
                    rowKey="id"
                    size="small"
                    bordered
                    columns={columns}
                    dataSource={mockHailinHourlyRecords}
                    scroll={{ x: meterFilter === '全部' ? 1200 : 280 }}
                    pagination={{
                      ...pagination,
                      onChange: (page) => setPagination((p) => ({ ...p, current: page })),
                    }}
                  />
                </>
              ),
            },
            {
              key: 'export',
              label: '报表导出',
              children: (
                <div style={{ padding: 24, color: 'rgba(0,0,0,0.45)' }}>
                  支持导出分区汇总、产销差损、分时明细等报表，可按日期与能量计筛选后导出 Excel。
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
