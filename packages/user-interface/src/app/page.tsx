import { MainLayout } from '@/components/layout/main-layout';
import { TaskDashboard } from '@/components/task/task-dashboard';
import { AuthGuard } from '@/components/auth';

export default function HomePage() {
  return (
    <AuthGuard>
      <MainLayout>
        <TaskDashboard />
      </MainLayout>
    </AuthGuard>
  );
}
