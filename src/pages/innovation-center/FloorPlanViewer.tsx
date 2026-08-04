import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Breadcrumb,
  Form,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  CloudUploadOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  VideoCameraOutlined,
  ThunderboltOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { FlowMeterDevice } from '../../types/innovationCenter';
import {
  floorPlanDetails,
  getBuildingFloorsByFloorId,
  getFloorDeviceStats,
  getFloorPlanBreadcrumb,
} from '../../data/mockFloorPlans';
import { getFlowMetersByFloor, mockFlowMeters } from '../../data/mockFlowMeters';
import { getFlowMeterRuntime } from '../../data/mockFlowMeterRuntime';
import { getFloorPlanImage, useFloorPlanStore } from '../../store/floorPlanStore';
import ImportFloorPlanModal from './ImportFloorPlanModal';
import FloorPlanCanvas from './FloorPlanCanvas';
import './InnovationCenter.css';

const statusLabel: Record<FlowMeterDevice['status'], string> = {
  online: '在线',
  offline: '离线',
  alarm: '报警',
};

const statusColor: Record<FlowMeterDevice['status'], string> = {
  online: 'success',
  offline: 'warning',
  alarm: 'error',
};

interface MapDevice extends FlowMeterDevice {
  pointId?: string;
  isCustomPoint?: boolean;
}

function deviceIcon(type: FlowMeterDevice['deviceType']) {
  if (type === '摄像头') return <VideoCameraOutlined />;
  if (type === '电表' || type === '门禁控制器') return <ThunderboltOutlined />;
  if (type === '温湿度传感器' || type === '氧浓度') return <CloudOutlined />;
  return <DashboardOutlined />;
}

export default function FloorPlanViewer() {
  const { floorId = 'building8-3f' } = useParams<{ floorId: string }>();
  const navigate = useNavigate();
  const mapInnerRef = useRef<HTMLDivElement>(null);

  const [floorPlanState, { addFloorPlanPoint }] = useFloorPlanStore();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [placingMode, setPlacingMode] = useState(false);
  const [pointModalOpen, setPointModalOpen] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ mapX: number; mapY: number } | null>(null);
  const [pointForm] = Form.useForm<{ deviceId: string }>();

  useEffect(() => {
    setSelectedDeviceId(null);
    setPlacingMode(false);
  }, [floorId]);

  const floor = floorPlanDetails[floorId] ?? floorPlanDetails['building8-3f'];
  const floorTabs = useMemo(() => getBuildingFloorsByFloorId(floorId), [floorId]);
  const breadcrumb = useMemo(() => getFloorPlanBreadcrumb(floorId), [floorId]);
  const floorImage = getFloorPlanImage(floorId);
  const customPoints = useMemo(
    () => floorPlanState.points.filter((p) => p.floorId === floorId),
    [floorPlanState.points, floorId],
  );

  const mapDevices = useMemo((): MapDevice[] => {
    const baseDevices = getFlowMetersByFloor(floorId);
    const pointByDevice = new Map(customPoints.map((p) => [p.deviceId, p]));
    const placedIds = new Set<string>();

    const merged: MapDevice[] = baseDevices.map((d) => {
      const cp = pointByDevice.get(d.id);
      placedIds.add(d.id);
      if (cp) {
        return { ...d, mapX: cp.mapX, mapY: cp.mapY, pointId: cp.id, isCustomPoint: true };
      }
      return d;
    });

    customPoints.forEach((cp) => {
      if (placedIds.has(cp.deviceId)) return;
      const device = mockFlowMeters.find((d) => d.id === cp.deviceId);
      if (device) {
        merged.push({
          ...device,
          floorId,
          mapX: cp.mapX,
          mapY: cp.mapY,
          pointId: cp.id,
          isCustomPoint: true,
        });
      }
    });

    return merged;
  }, [floorId, customPoints]);

  const stats = useMemo(() => getFloorDeviceStats(floorId), [floorId]);
  const selectedDevice = mapDevices.find((d) => d.id === selectedDeviceId);

  const availableDevicesForPoint = useMemo(
    () => getFlowMetersByFloor(floorId),
    [floorId],
  );

  const chartOption = useMemo(
    () => ({
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['52%', '78%'],
          center: ['50%', '50%'],
          label: { show: false },
          data: [
            { name: '在线', value: stats.online || 0, itemStyle: { color: '#52c41a' } },
            { name: '离线', value: stats.offline || 0, itemStyle: { color: '#fa8c16' } },
            { name: '报警', value: stats.alarm || 0, itemStyle: { color: '#ff4d4f' } },
          ],
        },
      ],
    }),
    [stats],
  );

  const typeColumns: ColumnsType<(typeof stats.typeStats)[number]> = [
    { title: '设备类型', dataIndex: 'type', ellipsis: true },
    {
      title: '在线',
      dataIndex: 'online',
      width: 48,
      align: 'center',
      render: (v: number) => <span className="stat-online">{v}</span>,
    },
    {
      title: '离线',
      dataIndex: 'offline',
      width: 48,
      align: 'center',
      render: (v: number) => <span className="stat-offline">{v}</span>,
    },
    {
      title: '报警',
      dataIndex: 'alarm',
      width: 48,
      align: 'center',
      render: (v: number) => <span className="stat-alarm">{v}</span>,
    },
  ];

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placingMode) return;
    if ((e.target as HTMLElement).closest('.floor-device-marker')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mapX = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const mapY = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    setPendingPosition({ mapX, mapY });
    pointForm.resetFields();
    setPointModalOpen(true);
  };

  const savePoint = async () => {
    try {
      const { deviceId } = await pointForm.validateFields();
      if (!pendingPosition) return;
      const device = mockFlowMeters.find((d) => d.id === deviceId);
      if (!device) return;

      addFloorPlanPoint({
        id: `fp-${Date.now()}`,
        floorId,
        deviceId,
        mapX: pendingPosition.mapX,
        mapY: pendingPosition.mapY,
        createdAt: new Date().toISOString(),
      });
      message.success(`已创建点位并关联设备「${device.name}」`);
      setPointModalOpen(false);
      setPendingPosition(null);
      setPlacingMode(false);
      setSelectedDeviceId(deviceId);
    } catch {
      /* validation */
    }
  };

  const mapBackgroundStyle = useMemo(() => {
    if (!floorImage) return undefined;
    if (floorImage.source === 'upload' && floorImage.imageUrl.startsWith('blob:')) {
      return {
        backgroundImage: `url(${floorImage.imageUrl})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      };
    }
    return { background: floorImage.imageUrl };
  }, [floorImage]);

  return (
    <div className="floor-viewer-page">
      <div className="floor-viewer-header">
        <div className="floor-viewer-header-left">
          <Breadcrumb
            className="floor-viewer-breadcrumb"
            items={breadcrumb.map((t) => ({ title: t }))}
          />
          <div className="floor-viewer-title-row">
            <span className="floor-viewer-title">{floor.floorName}</span>
            <Tag color="processing">{mapDevices.length} 个点位</Tag>
            {floorImage && (
              <Tag color="blue" icon={<CloudUploadOutlined />}>
                {floorImage.fileName}
              </Tag>
            )}
          </div>
        </div>
        <Space>
          <Button icon={<CloudUploadOutlined />} onClick={() => setImportOpen(true)}>
            导入图纸
          </Button>
          <Button
            type={placingMode ? 'primary' : 'default'}
            icon={<PlusOutlined />}
            onClick={() => {
              setPlacingMode((v) => !v);
              if (placingMode) setPendingPosition(null);
            }}
          >
            {placingMode ? '取消创建点位' : '创建点位'}
          </Button>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/innovation-center/floor-plans')}>
            返回列表
          </Button>
        </Space>
      </div>

      {placingMode && (
        <Alert
          type="info"
          showIcon
          icon={<EnvironmentOutlined />}
          message="创建点位模式：在图纸上点击位置，然后选择要关联的设备"
          className="floor-placing-alert"
        />
      )}

      <div className="floor-viewer-body">
        <div className="floor-viewer-map-wrap">
          <div className="floor-viewer-map-head">
            <h3>设备位置</h3>
          </div>

          <div className="floor-viewer-floor-tabs">
            {floorTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`floor-viewer-floor-tab${tab.floorId === floorId ? ' active' : ''}`}
                onClick={() => {
                  if (tab.floorId) navigate(`/innovation-center/floor-plans/${tab.floorId}`);
                }}
              >
                {tab.title}
              </button>
            ))}
          </div>

          <FloorPlanCanvas
            floor={floor}
            hasImage={!!floorImage}
            mapBackgroundStyle={mapBackgroundStyle}
            mapDevices={mapDevices}
            selectedDeviceId={selectedDeviceId}
            placingMode={placingMode}
            pendingPosition={pendingPosition}
            onMapClick={handleMapClick}
            onDeviceClick={(deviceId, e) => {
              e.stopPropagation();
              setSelectedDeviceId(deviceId);
            }}
            deviceIcon={deviceIcon}
            mapInnerRef={mapInnerRef}
          />

          <div className="floor-viewer-map-legend">
            <span><i className="dot online" />在线</span>
            <span><i className="dot offline" />离线</span>
            <span><i className="dot alarm" />报警</span>
            <span><i className="dot custom" />自定义点位</span>
          </div>
        </div>

        <div className="floor-viewer-sidebar">
          {selectedDevice ? (
            <>
              <div className="floor-sidebar-head">
                <h3>点位监测</h3>
                <Tag color={statusColor[selectedDevice.status]}>
                  {statusLabel[selectedDevice.status]}
                </Tag>
              </div>
              <DeviceMonitorPanel device={selectedDevice} />
              <Button type="link" className="floor-back-stats-btn" onClick={() => setSelectedDeviceId(null)}>
                ← 返回楼层统计
              </Button>
            </>
          ) : (
            <>
              <h3>设备概况</h3>
              <div className="floor-stats-chart">
                <ReactECharts option={chartOption} style={{ height: 180 }} />
              </div>
              <div className="floor-stats-legend">
                <span className="floor-stats-legend-item">
                  <span className="floor-stats-legend-dot online" />
                  在线 {stats.online}
                </span>
                <span className="floor-stats-legend-item">
                  <span className="floor-stats-legend-dot offline" />
                  离线 {stats.offline}
                </span>
                <span className="floor-stats-legend-item">
                  <span className="floor-stats-legend-dot alarm" />
                  报警 {stats.alarm}
                </span>
              </div>
              <Table
                size="small"
                rowKey="type"
                columns={typeColumns}
                dataSource={stats.typeStats}
                pagination={false}
                scroll={{ y: 280 }}
              />
            </>
          )}
        </div>
      </div>

      <ImportFloorPlanModal
        open={importOpen}
        floorId={floorId}
        floorName={floor.floorName}
        floorLabel={floor.floorLabel}
        onClose={() => setImportOpen(false)}
      />

      <Modal
        title="关联设备 — 创建点位"
        open={pointModalOpen}
        onCancel={() => {
          setPointModalOpen(false);
          setPendingPosition(null);
        }}
        onOk={savePoint}
        okText="保存点位"
        destroyOnHidden
      >
        {pendingPosition && (
          <p className="floor-point-coord">
            点位坐标：X {pendingPosition.mapX}% · Y {pendingPosition.mapY}%
          </p>
        )}
        <Form form={pointForm} layout="vertical">
          <Form.Item
            label="关联设备"
            name="deviceId"
            rules={[{ required: true, message: '请选择要关联的设备' }]}
            extra="从设备列表中选择，点击点位时将展示该设备的监测数据"
          >
            <Select
              showSearch
              placeholder="搜索设备名称或编号"
              optionFilterProp="label"
              options={availableDevicesForPoint.map((d) => ({
                label: `${d.name}（${d.code} · ${d.deviceType}）`,
                value: d.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function DeviceMonitorPanel({ device }: { device: FlowMeterDevice }) {
  const [runtime, setRuntime] = useState(() => getFlowMeterRuntime(device));
  const offline = device.status === 'offline';

  useEffect(() => {
    setRuntime(getFlowMeterRuntime(device));
    const timer = setInterval(() => setRuntime(getFlowMeterRuntime(device)), 3000);
    return () => clearInterval(timer);
  }, [device]);

  const infoRows: Array<{ label: string; value: string }> = [
    { label: '设备类型', value: device.deviceType },
    { label: '设备命名', value: device.name },
    { label: '设备编码', value: device.code },
    { label: '房间号', value: device.roomNo || '-' },
    { label: '设备IP', value: device.ip || '-' },
  ];

  return (
    <div className="floor-device-monitor">
      <div className="floor-device-detail">
        {infoRows.map((row) => (
          <div key={row.label} className="floor-device-detail-row">
            <span className="label">{row.label}</span>
            <span className="value">{row.value}</span>
          </div>
        ))}
      </div>

      {runtime && (
        <div className="floor-device-readings">
          <h4>实时监测读数</h4>
          <div className="floor-reading-grid">
            {runtime.readings.map((item) => (
              <div key={item.key} className="floor-reading-card">
                <div className="reading-label">{item.label}</div>
                <div className="reading-value" style={{ color: item.accent ?? '#1890ff' }}>
                  {offline ? '--' : item.value}
                  {item.unit && !offline && <span className="reading-unit">{item.unit}</span>}
                </div>
              </div>
            ))}
          </div>
          <p className="floor-reading-time">更新：{runtime.updatedAt}</p>
        </div>
      )}
    </div>
  );
}
