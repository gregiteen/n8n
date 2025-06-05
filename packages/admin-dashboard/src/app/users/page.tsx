import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { UsersTable } from '@/components/users/users-table';
import { UserActions } from '@/components/users/user-actions';
import { UserStats } from '@/components/users/user-stats';

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="mt-2 text-muted-foreground">
              Manage user accounts, permissions, and access controls
            </p>
          </div>
          <UserActions />
        </div>

        <UserStats />
        <UsersTable />
      </div>
    </DashboardLayout>
  );
}
