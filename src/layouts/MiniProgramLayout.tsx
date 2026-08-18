import { Outlet } from 'react-router-dom';
import PlatformSwitcher from '../components/PlatformSwitcher';
import './MiniProgramLayout.css';

export default function MiniProgramLayout() {
  return (
    <div className="mini-program-layout">
      <header className="mini-program-layout-header">
        <span className="mini-program-layout-title">生物芯片智慧园区 · 小程序端</span>
        <PlatformSwitcher />
      </header>
      <main className="mini-program-layout-main">
        <div className="mini-program-viewport">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
