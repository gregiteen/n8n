import { MainLayout } from '@/components/layout/main-layout';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { AuthGuard } from '@/components/auth';

export default function SettingsPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <SettingsPanel />
      </MainLayout>
    </AuthGuard>
  );
}
