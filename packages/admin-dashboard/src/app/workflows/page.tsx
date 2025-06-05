import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { WorkflowsList } from '@/components/workflows/workflows-list';
import { WorkflowStats } from '@/components/workflows/workflow-stats';
import { WorkflowActions } from '@/components/workflows/workflow-actions';

export default function WorkflowsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Workflows</h1>
            <p className="mt-2 text-muted-foreground">
              Monitor workflow executions, performance, and manage automation processes
            </p>
          </div>
          <WorkflowActions />
        </div>

        <WorkflowStats />
        <WorkflowsList />
      </div>
    </DashboardLayout>
  );
}
