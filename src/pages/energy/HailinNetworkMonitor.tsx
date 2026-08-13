import { useEffect, useMemo, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Input,
  Space,
  Tag,
  Tree,
} from 'antd';
import {
  FullscreenOutlined,
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { HailinMeterDevice } from '../../types/hailinMeter';
import {
  getHailinDeviceById,
  getHailinRuntime,
  hailinDiagramNodes,
  hailinNetworkTree,
  hailinPipeSegments,
} from '../../data/mockHailinMeters';
import { getHailinRuntimeDetailRows } from '../../config/hailinRuntimeFields';
import HailinNetworkCanvas from './HailinNetworkCanvas';
import './HailinMeter.css';

function toTreeData(nodes: typeof hailinNetworkTree): DataNode[] {
  return nodes.map((n) => ({
    key: n.key,
    title: n.title,
    icon: n.code ? <span className={`hailin-status-dot ${n.status}`} /> : undefined,
    children: n.children ? toTreeData(n.children) : undefined,
    selectable: Boolean(n.code),
    isLeaf: Boolean(n.code),
  }));
}

function filterTreeNodes(nodes: DataNode[], keyword: string): DataNode[] {
  if (!keyword.trim()) return nodes;
  const kw = keyword.trim().toLowerCase();

  return nodes
    .map((node) => {
      const children = node.children ? filterTreeNodes(node.children, keyword) : undefined;
      const titleText = String(node.title ?? '').toLowerCase();
      const matched = titleText.includes(kw) || Boolean(children?.length);
      if (!matched) return null;
      return { ...node, children };
    })
    .filter(Boolean) as DataNode[];
}

export default function HailinNetworkMonitor() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('hailin-W004');
  const [zoom, setZoom] = useState(100);
  const [runtime, setRuntime] = useState(() => getHailinRuntime('hailin-W004'));

  const treeData = useMemo(() => toTreeData(hailinNetworkTree), []);
  const filteredTreeData = useMemo(
    () => filterTreeNodes(treeData, search),
    [treeData, search],
  );
  const device = useMemo(() => getHailinDeviceById(selectedId), [selectedId]);

  useEffect(() => {
    setRuntime(getHailinRuntime(selectedId));
    const timer = setInterval(() => setRuntime(getHailinRuntime(selectedId)), 3000);
    return () => clearInterval(timer);
  }, [selectedId]);

  const handleRefresh = () => {
    setRuntime(getHailinRuntime(selectedId));
  };

  return (
    <div className="hailin-network-page">
      <div className="hailin-page-header hailin-network-page-header">
        <Breadcrumb items={[{ title: '管网监控' }, { title: '工艺组态监控' }]} />
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新数据</Button>
          <Button icon={<FullscreenOutlined />} />
        </Space>
      </div>

      <div className="hailin-monitor-layout">
        <div className="hailin-monitor-tree">
          <div className="hailin-monitor-tree-head">管网点位结构</div>
          <div className="hailin-monitor-tree-search">
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索流量计..."
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Tree
            blockNode
            showIcon
            treeData={filteredTreeData}
            defaultExpandAll
            selectedKeys={[selectedId]}
            onSelect={(keys) => {
              const key = keys[0] as string | undefined;
              if (key?.startsWith('hailin-')) {
                setSelectedId(key);
              }
            }}
          />
        </div>

        <div className="hailin-monitor-center">
          <div className="hailin-monitor-center-head">
            <strong>2D 管网平面图</strong>
            <div className="hailin-diagram-legend">
              <span><span className="line main" />总管</span>
              <span><span className="line branch" />支路</span>
              <span><span className="hailin-status-dot online" />在线</span>
              <span><span className="hailin-status-dot alarm" />异常</span>
              <span><span className="hailin-status-dot offline" />离线</span>
            </div>
            <Space className="hailin-diagram-zoom" size={4}>
              <Button size="small" icon={<MinusOutlined />} onClick={() => setZoom((z) => Math.max(60, z - 10))} />
              <span className="hailin-zoom-label">{zoom}%</span>
              <Button size="small" icon={<PlusOutlined />} onClick={() => setZoom((z) => Math.min(140, z + 10))} />
            </Space>
          </div>
          <div className="hailin-diagram-wrap hailin-network-floor-wrap">
            <div className="hailin-diagram-stage" style={{ transform: `scale(${zoom / 100})` }}>
              <HailinNetworkCanvas
                pipeSegments={hailinPipeSegments}
                nodes={hailinDiagramNodes}
                selectedId={selectedId}
                onNodeClick={setSelectedId}
              />
            </div>
          </div>
        </div>

        <div className="hailin-monitor-detail">
          {device && runtime ? (
            <>
              <div className="hailin-detail-head hailin-flowmeter-detail-head">
                <div className="hailin-flowmeter-icon">⚙</div>
                <div>
                  <h3>{device.code}</h3>
                  <p>{device.installLocation} · <Tag color={device.status === 'online' ? 'success' : 'default'}>{device.status === 'online' ? '在线' : '离线'}</Tag></p>
                </div>
              </div>
              <DetailSection title="基础信息" device={device} />
              <div className="hailin-detail-section">
                <h4>实时监测数据</h4>
                <div className="hailin-runtime-field-list hailin-runtime-field-list-compact">
                  {getHailinRuntimeDetailRows(runtime).map((row) => (
                    <div key={row.label} className="hailin-runtime-field-item">
                      <span className="label">{row.label}</span>
                      <span className="value">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="hailin-empty-detail">请点击左侧树或流程图节点查看详情</div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, device }: { title: string; device: HailinMeterDevice }) {
  const rows = [
    ['流量计编号', device.code],
    ['所属分区', device.zone],
    ['介质', device.medium],
    ['量程', device.rangeSpec],
    ['安装位置', device.installLocation],
    ['通讯方式', device.protocol],
  ];
  return (
    <div className="hailin-detail-section">
      <h4>{title}</h4>
      {rows.map(([label, value]) => (
        <div key={label} className="hailin-info-row">
          <span className="label">{label}</span>
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
}
