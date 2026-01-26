import { DashboardNavigation } from './DashboardNavigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  isSidebarOpen: boolean;
}

export function DashboardLayout({ children, sidebar, isSidebarOpen }: DashboardLayoutProps) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden text-sm bg-gs-body text-gs-text-main">
      {/* Navigation Bar */}
      <DashboardNavigation />

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col min-w-0 ${isSidebarOpen ? 'border-r border-white/[0.06]' : ''}`}>
          {children}
        </main>

        {/* AI Sidebar */}
        {isSidebarOpen && (
          <aside className="w-[400px] flex flex-col bg-gs-card border-l border-white/[0.06] flex-shrink-0">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
