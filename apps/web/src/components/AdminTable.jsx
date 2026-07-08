
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const AdminTable = ({ children }) => {
  return (
    <Card className="border-border shadow-sm overflow-hidden">
      <CardContent className="p-0 overflow-x-auto">
        {children}
      </CardContent>
    </Card>
  );
};

export default AdminTable;
