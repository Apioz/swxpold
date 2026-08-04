import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Breadcrumb,
  Button,
  Empty,
  Input,
  Statistic,
  Tree,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  ArrowRightOutlined,
  BankOutlined,
  BuildOutlined,
  CloudUploadOutlined,
  FileImageOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { FloorPlanNode } from '../../types/innovationCenter';
import {
  findFloorPlanNode,
  floorPlanDetails,
  floorPlanTree,
  getBuildingSummary,
  getCampusSummary,
  getFloorDeviceStats,
  getFloorPlanBreadcrumb,
} from '../../data/mockFloorPlans';
import { getFlowMetersByFloor } from '../../data/mockFlowMeters';
import { useFloorPlanStore } from '../../store/floorPlanStore';
import BatchImportFloorPlanModal from './BatchImportFloorPlanModal';
import './InnovationCenter.css';

const { DirectoryTree } = Tree;

function filterTree(nodes: FloorPlanNode[], keyword: string): FloorPlanNode[] {
  if (!keyword.trim()) return nodes;
  const kw = keyword.trim().toLowerCase();

  const walk = (list: FloorPlanNode[]): FloorPlanNode[] =>
    list
      .map((node) => {
        const children = node.children ? walk(node.children) : undefined;
        const selfMatch = node.title.toLowerCase().includes(kw);
        if (selfMatch || (children && children.length > 0)) {
          return { ...node, children };
        }
        return null;
      })
      .filter(Boolean) as FloorPlanNode[];

  return walk(nodes);
}

function toTreeData(nodes: FloorPlanNode[]): DataNode[] {
  return nodes.map((node) => ({
    key: node.key,
    title: node.title,
    icon:
      node.nodeType === 'campus' ? (
        <BankOutlined className="floor-tree-icon campus" />
      ) : node.nodeType === 'building' ? (
        <BuildOutlined className="floor-tree-icon building" />
      ) : (
        <FileImageOutlined className="floor-tree-icon floor" />
      ),
    children: node.children ? toTreeData(node.children) : undefined,
    isLeaf: node.isLeaf,
  }));
}

function collectOpenKeys(nodes: FloorPlanNode[]): string[] {
  const keys: string[] = [];
  const walk = (list: FloorPlanNode[]) => {
    list.forEach((n) => {
      if (n.children?.length) {
        keys.push(n.key);
        walk(n.children);
      }
    });
  };
  walk(nodes);
  return keys;
}

export default function FloorPlanManagement() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [selectedKey, setSelectedKey] = useState('building8-3f');
  const [batchImportOpen, setBatchImportOpen] = useState(false);
  const [floorPlanState] = useFloorPlanStore();
  const campusSummary = useMemo(() => getCampusSummary(), []);
  const importedImageCount = Object.keys(floorPlanState.images).length;

  const filteredTree = useMemo(
    () => filterTree(floorPlanTree, keyword),
    [keyword],
  );
  const openKeys = useMemo(() => collectOpenKeys(filteredTree), [filteredTree]);

  const selected = useMemo(() => findFloorPlanNode(selectedKey), [selectedKey]);

  const enterFloor = (floorId: string) => {
    navigate(`/innovation-center/floor-plans/${floorId}`);
  };

  const renderDetail = () => {
    if (!selected) {
      return <Empty description="请在左侧选择园区、楼栋或楼层" />;
    }

    const { node, parents } = selected;

    if (node.nodeType === 'campus') {
      return (
        <div className="floor-plan-detail-panel">
          <Breadcrumb
            className="floor-plan-breadcrumb"
            items={[{ title: node.title }]}
          />
          <h3 className="floor-plan-detail-title">{node.title}</h3>
          <p className="floor-plan-detail-desc">
            园区共 {campusSummary.buildingCount} 栋楼宇、{campusSummary.floorCount} 张楼层图纸，
            覆盖 {campusSummary.deviceCount} 个设备点位。
          </p>
          <div className="floor-plan-stat-row">
            <Statistic title="楼栋数" value={campusSummary.buildingCount} suffix="栋" />
            <Statistic title="楼层图纸" value={campusSummary.floorCount} suffix="张" />
            <Statistic title="设备点位" value={campusSummary.deviceCount} suffix="个" />
            <Statistic title="已导入图纸" value={importedImageCount} suffix="张" />
          </div>
          <div className="floor-plan-campus-actions">
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => setBatchImportOpen(true)}
            >
              批量导入图纸
            </Button>
          </div>
          <p className="floor-plan-detail-tip">
            支持一键上传或从底座文件中心按楼栋文件夹批量导入；文件名须与图纸目录名称一一对应。
            展开楼栋节点，选择具体楼层后可进入二维平面图。
          </p>
        </div>
      );
    }

    if (node.nodeType === 'building') {
      const summary = getBuildingSummary(node.key);
      const breadcrumb = [...parents.map((p) => p.title), node.title];
      return (
        <div className="floor-plan-detail-panel">
          <Breadcrumb
            className="floor-plan-breadcrumb"
            items={breadcrumb.map((t) => ({ title: t }))}
          />
          <h3 className="floor-plan-detail-title">{node.title}</h3>
          <p className="floor-plan-detail-desc">
            本楼栋共 {summary?.floorCount ?? 0} 个楼层，已配置 {summary?.deviceCount ?? 0} 个设备点位。
          </p>
          <div className="floor-plan-stat-row">
            <Statistic title="楼层数" value={summary?.floorCount ?? 0} suffix="层" />
            <Statistic title="设备点位" value={summary?.deviceCount ?? 0} suffix="个" />
          </div>
          <div className="floor-plan-floor-list">
            {(node.children ?? []).map((floor) => {
              const devices = floor.floorId
                ? getFlowMetersByFloor(floor.floorId).length
                : 0;
              return (
                <div
                  key={floor.key}
                  className={`floor-plan-floor-item${selectedKey === floor.key ? ' active' : ''}`}
                  onClick={() => setSelectedKey(floor.key)}
                >
                  <FileImageOutlined />
                  <span className="name">{floor.title}</span>
                  <span className="meta">{devices} 个点位</span>
                  {floor.floorId && (
                    <Button
                      type="link"
                      size="small"
                      icon={<ArrowRightOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        enterFloor(floor.floorId!);
                      }}
                    >
                      进入
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (node.nodeType === 'floor' && node.floorId) {
      const detail = floorPlanDetails[node.floorId];
      const devices = getFlowMetersByFloor(node.floorId);
      const stats = getFloorDeviceStats(node.floorId);
      const breadcrumb = getFloorPlanBreadcrumb(node.floorId);

      return (
        <div className="floor-plan-detail-panel">
          <Breadcrumb
            className="floor-plan-breadcrumb"
            items={breadcrumb.map((t) => ({ title: t }))}
          />
          <h3 className="floor-plan-detail-title">{detail.floorName}</h3>

          <div className="floor-plan-preview-large">
            {detail.rooms.map((room) => (
              <div
                key={room.id}
                className="floor-plan-mini-room"
                style={{
                  left: `${room.x}%`,
                  top: `${room.y}%`,
                  width: `${room.width}%`,
                  height: `${room.height}%`,
                }}
              />
            ))}
            {devices.slice(0, 16).map((d) => (
              <span
                key={d.id}
                className={`floor-plan-mini-dot ${d.status}`}
                style={{ left: `${d.mapX}%`, top: `${d.mapY}%` }}
              />
            ))}
          </div>

          <div className="floor-plan-stat-row">
            <Statistic title="区域/房间" value={detail.rooms.length} suffix="个" />
            <Statistic title="设备点位" value={devices.length} suffix="个" />
            <Statistic title="在线设备" value={stats.online} suffix="个" />
          </div>

          <div className="floor-plan-info-stats">
            <Badge color="#52c41a" text={`在线 ${stats.online}`} />
            <Badge color="#fa8c16" text={`离线 ${stats.offline}`} />
            <Badge color="#ff4d4f" text={`报警 ${stats.alarm}`} />
          </div>

          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            className="floor-plan-enter-btn"
            onClick={() => enterFloor(node.floorId!)}
          >
            进入平面图
          </Button>
        </div>
      );
    }

    return <Empty description="暂无数据" />;
  };

  return (
    <div className="innovation-page floor-plan-manage-page">
      <div className="floor-plan-manage-header">
        <div>
          <h2>二维图纸管理</h2>
          <p>园区 → 楼栋 → 楼层 三级结构，每层楼一张图纸，点击进入平面图查看设备分布。</p>
        </div>
        <div className="floor-plan-manage-header-stats">
          <span>{campusSummary.buildingCount} 栋楼</span>
          <span>{campusSummary.floorCount} 张图纸</span>
        </div>
      </div>

      <div className="floor-plan-manage-body">
        <div className="floor-plan-tree-panel">
          <div className="floor-plan-tree-panel-head">
            <span className="panel-title">图纸目录</span>
            <Input
              allowClear
              size="small"
              placeholder="搜索楼栋/楼层"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="floor-plan-tree-level-hint">
            <span><BankOutlined /> 园区</span>
            <span><BuildOutlined /> 楼栋</span>
            <span><FileImageOutlined /> 楼层图纸</span>
          </div>
          <DirectoryTree
            showIcon
            blockNode
            defaultExpandAll
            expandedKeys={openKeys}
            selectedKeys={[selectedKey]}
            treeData={toTreeData(filteredTree)}
            onSelect={(keys) => {
              if (keys[0]) setSelectedKey(String(keys[0]));
            }}
            onDoubleClick={(_e, node) => {
              const match = findFloorPlanNode(String(node.key));
              if (match?.node.floorId) {
                enterFloor(match.node.floorId);
              }
            }}
          />
        </div>

        <div className="floor-plan-detail-wrap">{renderDetail()}</div>
      </div>

      <BatchImportFloorPlanModal
        open={batchImportOpen}
        campusName={campusSummary.campusName}
        onClose={() => setBatchImportOpen(false)}
      />
    </div>
  );
}
