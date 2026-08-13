import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import MidPlatformLayout from './layouts/MidPlatformLayout';
import PlaceholderPage from './pages/PlaceholderPage';
import SparePartsLedger from './pages/spare-parts/SparePartsLedger';
import InboundManagement from './pages/spare-parts/InboundManagement';
import OutboundManagement from './pages/spare-parts/OutboundManagement';
import RealTimeEvents from './pages/security/RealTimeEvents';
import EventPushConfig from './pages/security/EventPushConfig';
import NotificationMethodConfig from './pages/security/NotificationMethodConfig';
import AlarmStatistics from './pages/security/AlarmStatistics';
import AlarmEvents from './pages/security/AlarmEvents';
import EventWorkbench from './pages/security/EventWorkbench';
import FlowMeterManagement from './pages/innovation-center/FlowMeterManagement';
import PlcHvacManagement from './pages/plc-hvac/PlcHvacManagement';
import AccessPermissionConfig from './pages/access-control/AccessPermissionConfig';
import AccessDeviceManagement from './pages/security/access-control/AccessDeviceManagement';
import AccessRecognitionRecords from './pages/security/access-control/AccessRecognitionRecords';
import HailinMeterLedger from './pages/energy/HailinMeterLedger';
import HailinNetworkMonitor from './pages/energy/HailinNetworkMonitor';
import HailinDataAnalysis from './pages/energy/HailinDataAnalysis';
import MidPlatformPersonnelManagement from './pages/mid-platform/operations/PersonnelManagement';
import OperationsHome from './pages/mid-platform/operations/OperationsHome';
import './App.css';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 4,
        },
      }}
    >
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/spare-parts/ledger" replace />} />
            <Route
              path="home"
              element={<PlaceholderPage title="首页" />}
            />
            <Route
              path="workbench"
              element={<PlaceholderPage title="工作台" />}
            />
            <Route
              path="assets"
              element={<PlaceholderPage title="资产台账" />}
            />
            <Route
              path="schedule"
              element={<PlaceholderPage title="工作排班" />}
            />
            <Route
              path="repair"
              element={<PlaceholderPage title="报修管理" />}
            />
            <Route
              path="maintenance"
              element={<PlaceholderPage title="维保管理" />}
            />
            <Route
              path="inspection"
              element={<PlaceholderPage title="巡检管理" />}
            />
            <Route path="spare-parts/ledger" element={<SparePartsLedger />} />
            <Route path="spare-parts/inbound" element={<InboundManagement />} />
            <Route
              path="spare-parts/outbound"
              element={<OutboundManagement />}
            />
            <Route
              path="security/events/realtime"
              element={<RealTimeEvents />}
            />
            <Route
              path="security/events/push-config"
              element={<EventPushConfig />}
            />
            <Route
              path="security/events/notification"
              element={<NotificationMethodConfig />}
            />
            <Route
              path="security/alarms/statistics"
              element={<AlarmStatistics />}
            />
            <Route
              path="security/alarms/events"
              element={<AlarmEvents />}
            />
            <Route
              path="security/alarms/workbench"
              element={<EventWorkbench />}
            />
            <Route
              path="security/access-control/permissions"
              element={<AccessPermissionConfig />}
            />
            <Route
              path="security/access-control/devices"
              element={<AccessDeviceManagement />}
            />
            <Route
              path="security/access-control/records"
              element={<AccessRecognitionRecords />}
            />
            <Route
              path="security/parking"
              element={<PlaceholderPage title="停车管理" />}
            />
            <Route
              path="security/monitoring"
              element={<PlaceholderPage title="监控管理" />}
            />
            <Route
              path="security/passage"
              element={<PlaceholderPage title="通行管理" />}
            />
            <Route
              path="security/iot"
              element={<PlaceholderPage title="物联管理" />}
            />
            <Route
              path="energy/reports"
              element={<PlaceholderPage title="能源报表" />}
            />
            <Route
              path="energy/statistics"
              element={<PlaceholderPage title="能源统计" />}
            />
            <Route
              path="energy/power-analysis"
              element={<PlaceholderPage title="电能分析" />}
            />
            <Route
              path="energy/power-devices"
              element={<PlaceholderPage title="电能设备管理" />}
            />
            <Route
              path="energy/types"
              element={<PlaceholderPage title="能源类型管理" />}
            />
            <Route
              path="energy/levels"
              element={<PlaceholderPage title="能源层级管理" />}
            />
            <Route
              path="energy/alarm-center"
              element={<PlaceholderPage title="报警中心" />}
            />
            <Route
              path="energy/hailin-meter"
              element={<Navigate to="/energy/hailin-meter/devices" replace />}
            />
            <Route
              path="energy/hailin-meter/devices"
              element={<HailinMeterLedger />}
            />
            <Route
              path="energy/hailin-meter/network"
              element={<HailinNetworkMonitor />}
            />
            <Route
              path="energy/hailin-meter/analysis"
              element={<HailinDataAnalysis />}
            />
            <Route
              path="innovation-center/flow-meters"
              element={<FlowMeterManagement />}
            />
            <Route
              path="innovation-center/data-records"
              element={<Navigate to="/innovation-center/flow-meters" replace />}
            />
            <Route
              path="innovation-center/flow-meters/history"
              element={<Navigate to="/innovation-center/flow-meters" replace />}
            />
            <Route
              path="innovation-center/floor-plans/*"
              element={<Navigate to="/innovation-center/flow-meters" replace />}
            />
            <Route path="plc-hvac/systems" element={<PlcHvacManagement />} />
            <Route
              path="process"
              element={<PlaceholderPage title="流程管理" />}
            />
            <Route
              path="mobile"
              element={<PlaceholderPage title="移动端管理" />}
            />
            <Route
              path="customer"
              element={<PlaceholderPage title="客户管理" />}
            />
            <Route
              path="project"
              element={<PlaceholderPage title="项目管理" />}
            />
            <Route
              path="system"
              element={<PlaceholderPage title="系统管理" />}
            />
            <Route
              path="task"
              element={<PlaceholderPage title="任务管理" />}
            />
            <Route path="*" element={<Navigate to="/spare-parts/ledger" replace />} />
          </Route>
          <Route path="/mid-platform" element={<MidPlatformLayout />}>
            <Route
              index
              element={<Navigate to="/mid-platform/operations/personnel" replace />}
            />
            <Route path="operations/home" element={<OperationsHome />} />
            <Route
              path="operations/personnel"
              element={<MidPlatformPersonnelManagement />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
