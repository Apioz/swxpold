import { Tabs } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuditFlowConfigList from './AuditFlowConfigList';
import ReservationLimitConfigList from './ReservationLimitConfigList';
import './AuditFlowConfig.css';

const TAB_ITEMS = [
  { key: 'audit-flow', label: '审核流程配置' },
  { key: 'reservation-limit', label: '预约占用限制配置' },
] as const;

type FlowConfigTabKey = (typeof TAB_ITEMS)[number]['key'];

function resolveActiveTab(tab: string | null): FlowConfigTabKey {
  return tab === 'reservation-limit' ? 'reservation-limit' : 'audit-flow';
}

export default function SystemFlowConfigPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = resolveActiveTab(searchParams.get('tab'));

  const handleTabChange = (key: string) => {
    const tab = key as FlowConfigTabKey;
    if (tab === 'reservation-limit') {
      navigate('/system/audit-flow?tab=reservation-limit');
      return;
    }
    navigate('/system/audit-flow');
  };

  return (
    <div className="system-flow-config-page">
      <div className="system-flow-config-header">
        <h2 className="system-flow-config-title">流程配置</h2>
        <p className="system-flow-config-desc">
          审核流程控制「能不能约」；预约占用限制控制「约多久、约多频繁、约多少间」，用于预防恶意占用会议室资源。
        </p>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={TAB_ITEMS.map((item) => ({
          key: item.key,
          label: item.label,
          children:
            item.key === 'audit-flow' ? (
              <AuditFlowConfigList embedded />
            ) : (
              <ReservationLimitConfigList embedded />
            ),
        }))}
      />
    </div>
  );
}
