import { useMemo, useState } from 'react';
import { Button, DatePicker, Radio, Space, Table } from 'antd';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import {
  alarmStatsSummary,
  alarmTrendData,
  categoryProportion,
  levelProportion,
  top5Events,
} from '../../data/mockSecurity';
import './SecurityPages.css';

type TimeDim = '日' | '月' | '年';

export default function AlarmStatistics() {
  const [timeDim, setTimeDim] = useState<TimeDim>('月');
  const [month, setMonth] = useState(dayjs('2026-07'));

  const levelChartOption = useMemo(
    () => ({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, left: 'center' },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          label: { show: false },
          data: levelProportion.map((item) => ({
            name: item.name,
            value: item.value,
          })),
          color: ['#52c41a', '#1890ff', '#ff4d4f'],
        },
      ],
    }),
    [],
  );

  const categoryChartOption = useMemo(
    () => ({
      tooltip: { trigger: 'item' },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 0,
        top: 'middle',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11 },
        data: categoryProportion.map((d) => d.name),
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          label: { show: false },
          data: categoryProportion.filter((d) => d.value > 0),
          color: ['#1890ff'],
        },
      ],
    }),
    [],
  );

  const trendChartOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: 48, right: 24, top: 24, bottom: 32 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: alarmTrendData.map((d) => d.date.slice(5)),
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: '报警数',
        max: 180,
      },
      series: [
        {
          name: '报警数',
          type: 'line',
          smooth: true,
          areaStyle: { color: 'rgba(250, 140, 22, 0.25)' },
          lineStyle: { color: '#fa8c16', width: 2 },
          itemStyle: { color: '#fa8c16' },
          data: alarmTrendData.map((d) => d.count),
        },
      ],
    }),
    [],
  );

  return (
    <div className="alarm-stats-page">
      <div className="alarm-stats-filter">
        <span style={{ color: 'rgba(0,0,0,0.65)' }}>时间维度</span>
        <Radio.Group
          value={timeDim}
          onChange={(e) => setTimeDim(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: '日', value: '日' },
            { label: '月', value: '月' },
            { label: '年', value: '年' },
          ]}
        />
        <DatePicker
          picker={timeDim === '年' ? 'year' : timeDim === '月' ? 'month' : 'date'}
          value={month}
          onChange={(v) => v && setMonth(v)}
          allowClear={false}
        />
        <Space>
          <Button type="primary">查询</Button>
          <Button>清空</Button>
        </Space>
      </div>

      <div className="alarm-stats-row alarm-stats-row-top">
        <div className="alarm-stats-panel">
          <div className="alarm-stats-panel-title">报警情况</div>
          <div className="alarm-status-circles">
            <div className="alarm-status-circle">
              <div className="circle green">{alarmStatsSummary.pending}</div>
              <div className="label">未处理</div>
            </div>
            <div className="alarm-status-circle">
              <div className="circle blue">{alarmStatsSummary.processing}</div>
              <div className="label">处理中</div>
            </div>
            <div className="alarm-status-circle">
              <div className="circle orange">{alarmStatsSummary.processed}</div>
              <div className="label">已处理</div>
            </div>
          </div>
        </div>

        <div className="alarm-stats-panel">
          <div className="alarm-stats-panel-title">事件等级占比</div>
          <ReactECharts option={levelChartOption} className="alarm-chart" />
        </div>

        <div className="alarm-stats-panel">
          <div className="alarm-stats-panel-title">事件分类占比</div>
          <ReactECharts option={categoryChartOption} className="alarm-chart" />
        </div>
      </div>

      <div className="alarm-stats-row alarm-stats-row-bottom">
        <div className="alarm-stats-panel">
          <div className="alarm-stats-panel-title">频报事件Top5</div>
          <Table
            size="small"
            pagination={false}
            rowKey="rank"
            dataSource={top5Events}
            columns={[
              {
                title: 'TOP5',
                dataIndex: 'rank',
                width: 70,
                align: 'center',
                render: (rank: number) => (
                  <span className={`top5-rank r${rank}`}>{rank}</span>
                ),
              },
              { title: '事件分类', dataIndex: 'category' },
              {
                title: '频报事件次数',
                dataIndex: 'count',
                align: 'right',
                render: (v: number) => `${v}次`,
              },
            ]}
          />
        </div>

        <div className="alarm-stats-panel">
          <div className="alarm-stats-panel-title">报警趋势图</div>
          <ReactECharts option={trendChartOption} className="alarm-chart" />
        </div>
      </div>
    </div>
  );
}
