'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { ScrollArea } from '@/components/ui/scroll-area';

const auditLogs = [
  {
    id: '1',
    timestamp: '2024-01-15 10:30:45',
    action: 'Data Export Request',
    user: 'john.doe@example.com',
    status: 'Completed',
    details: 'User requested complete data export',
  },
  {
    id: '2',
    timestamp: '2024-01-15 09:15:22',
    action: 'Consent Updated',
    user: 'jane.smith@example.com',
    status: 'Completed',
    details: 'User updated marketing consent preferences',
  },
  {
    id: '3',
    timestamp: '2024-01-14 16:45:12',
    action: 'Data Deletion Request',
    user: 'admin@example.com',
    status: 'In Progress',
    details: 'Automated data deletion for expired records',
  },
  {
    id: '4',
    timestamp: '2024-01-14 14:20:33',
    action: 'Privacy Policy Update',
    user: 'admin@example.com',
    status: 'Completed',
    details: 'Privacy policy version 2.1 published',
  },
  {
    id: '5',
    timestamp: '2024-01-14 11:55:18',
    action: 'Data Access Request',
    user: 'alice.johnson@example.com',
    status: 'Completed',
    details: 'User accessed personal data summary',
  },
];

export function PrivacyAuditLog() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Audit Log</CardTitle>
        <CardDescription>
          Track all privacy-related actions and data processing activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={log.status === 'Completed' ? 'default' : 'secondary'}
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.details}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
