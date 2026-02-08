import { DashboardNavigation } from "./DashboardNavigation";

interface DashboardLayoutProps {
    children: React.ReactNode;
    sidebar: React.ReactNode;
    isSidebarOpen: boolean;
    sidebarWidth?: number;
}

export function DashboardLayout({
    children,
    sidebar,
    isSidebarOpen,
    sidebarWidth = 400,
}: DashboardLayoutProps) {
    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden text-sm bg-gs-body text-gs-text-main">
            {/* Navigation Bar */}
            <DashboardNavigation />

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area */}
                <main
                    className={`flex-1 flex flex-col min-w-0 px-6 ${isSidebarOpen ? "border-r border-white/[0.06]" : ""}`}
                >
                    {children}
                </main>

                {/* Sidebar */}
                {isSidebarOpen && (
                    <aside
                        className="flex flex-col bg-gs-card border-l border-white/[0.06] flex-shrink-0"
                        style={{ width: `${sidebarWidth}px` }}
                    >
                        {sidebar}
                    </aside>
                )}
            </div>
        </div>
    );
}
