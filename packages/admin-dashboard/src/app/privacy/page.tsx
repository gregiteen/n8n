import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PrivacySettings } from '@/components/privacy/privacy-settings';
import { DataRetentionSettings } from '@/components/privacy/data-retention-settings';
import { ConsentManagement } from '@/components/privacy/consent-management';
import { PrivacyAuditLog } from '@/components/privacy/privacy-audit-log';

export default function PrivacyPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Privacy & Compliance</h1>
            <p className="mt-2 text-muted-foreground">
              Manage privacy settings, data retention, and compliance monitoring
            </p>
          </div>
        </div>

        <PrivacySettings />
        <DataRetentionSettings />
        <ConsentManagement />
        <PrivacyAuditLog />
      </div>
    </DashboardLayout>
  );
}
