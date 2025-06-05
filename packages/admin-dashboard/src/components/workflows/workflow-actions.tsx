import { Plus, RefreshCw, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function WorkflowActions() {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button variant="outline" size="sm">
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>
      <Button size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Create Workflow
      </Button>
    </div>
  );
}
