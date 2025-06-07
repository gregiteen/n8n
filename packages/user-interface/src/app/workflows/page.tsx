import { MainLayout } from '@/components/layout/main-layout';
import { WorkflowManager } from '@/components/workflow/workflow-manager';
import { AuthGuard } from '@/components/auth';

export default function WorkflowsPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <WorkflowManager />
      </MainLayout>
    </AuthGuard>
  );
}
