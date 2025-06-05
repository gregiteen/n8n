import { AgentStatus } from '@/components/dashboard/agent-status';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { SystemOverview } from '@/components/dashboard/system-overview';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Overview of your AI agent platform status and performance
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <SystemOverview />
          </div>
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AgentStatus />
          <RecentActivity />
        </div>
      </div>
    </DashboardLayout>
  );
}
