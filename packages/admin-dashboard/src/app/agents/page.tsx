import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AgentsList } from '@/components/agents/agents-list';
import { AgentStats } from '@/components/agents/agent-stats';
import { AgentActions } from '@/components/agents/agent-actions';

export default function AgentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AI Agents</h1>
            <p className="mt-2 text-muted-foreground">
              Monitor and manage AI agents, their performance, and configurations
            </p>
          </div>
          <AgentActions />
        </div>

        <AgentStats />
        <AgentsList />
      </div>
    </DashboardLayout>
  );
}
