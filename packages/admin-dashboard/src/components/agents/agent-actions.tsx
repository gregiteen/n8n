import { Plus, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function AgentActions() {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm">
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>
      <Button size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Agent
      </Button>
    </div>
  );
}
