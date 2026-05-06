import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  return (
    <div className="flex h-full bg-[#F5F6FA]">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileSidebar={mobileSidebar}
        setMobileSidebar={setMobileSidebar}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-[260px]' : 'lg:ml-[70px]'}`}>
        <Topbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          setMobileSidebar={setMobileSidebar}
        />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
