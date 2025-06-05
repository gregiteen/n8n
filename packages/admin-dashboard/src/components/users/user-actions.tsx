'use client';

import { Button } from '@/components/ui/button';
import { UserPlus, Download, Upload } from 'lucide-react';

export function UserActions() {
  return (
    <div className="flex items-center space-x-3">
      <Button variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button variant="outline" size="sm">
        <Upload className="mr-2 h-4 w-4" />
        Import
      </Button>
      <Button size="sm">
        <UserPlus className="mr-2 h-4 w-4" />
        Add User
      </Button>
    </div>
  );
}
