import { useEffect, useMemo, useState } from 'react';
import { SyncOutlined } from '@ant-design/icons';
import { Space, Table, Tag } from 'antd';
import type { HailinMeterRuntime, HailinSensorStatus } from '../../types/hailinMeter';
import { buildHailinRuntimeColumns } from '../../config/hailinRuntimeFields';
import { getHailinRuntime, mockHailinDevices } from '../../data/mockHailinMeters';
import './HailinMeter.css';

function SensorCell({ value }: { value: HailinSensorStatus | string }) {
  if (value === '正常') return <span className="hailin-sensor-ok">{value}</span>;
  if (value === '异常') return <span className="hailin-sensor-err">{value}</span>;
  return <span>{value || '-'}</span>;
}

export default function HailinRealtimeMonitor() {
  const [records, setRecords] = useState<HailinMeterRuntime[]>(() =>
    mockHailinDevices.map((d) => getHailinRuntime(d.id)!).filter(Boolean),
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRecords(mockHailinDevices.map((d) => getHailinRuntime(d.id)!).filter(Boolean));
      setTick((t) => t + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const columns = useMemo(() => {
    return buildHailinRuntimeColumns().map((col) => {
      const key = 'dataIndex' in col ? String(col.dataIndex) : '';
      if (
        ['integratorFault', 'inletTempSensor', 'returnTempSensor', 'flowSensor'].includes(key)
      ) {
        return {
          ...col,
          render: (v: HailinSensorStatus) => <SensorCell value={v} />,
        };
      }
      if (key === 'statusText') {
        return {
          ...col,
          render: (text: string, record: HailinMeterRuntime) => (
            <Tag color={record.status === 'online' ? 'success' : 'default'}>{text}</Tag>
          ),
        };
      }
      return col;
    });
  }, []);

  return (
    <div className="hailin-panel hailin-realtime-table">
      <div className="hailin-analysis-table-head">
        <Space>
          <strong>海林能量计实时监测</strong>
          {tick > 0 && (
            <Tag icon={<SyncOutlined spin />} color="processing">
              实时刷新
            </Tag>
          )}
        </Space>
        <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>共 {records.length} 台设备 · 每 3 秒更新</span>
      </div>
      <Table<HailinMeterRuntime>
        rowKey="deviceId"
        size="small"
        bordered
        columns={columns}
        dataSource={records}
        scroll={{ x: 3400 }}
        pagination={false}
      />
    </div>
  );
}
