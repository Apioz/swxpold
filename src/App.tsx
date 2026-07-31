import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
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
      <BrowserRouter>
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
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
