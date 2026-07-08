
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const AlertBadge = ({ alert, className }) => {
  return (
    <Badge variant="outline" className={cn('bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 gap-1 font-medium', className)}>
      <AlertTriangle className="w-3 h-3" />
      {alert}
    </Badge>
  );
};

export default AlertBadge;
