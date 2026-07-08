
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const FilterCardGroup = ({ filters, activeFilter, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <Card 
            key={filter.id}
            className={cn(
              "cursor-pointer transition-all duration-200 border",
              isActive 
                ? "bg-muted/60 border-foreground ring-1 ring-border" 
                : "bg-card hover:bg-muted/50 border-border"
            )}
            onClick={() => onSelect(filter.id)}
          >
            <CardContent className="p-3 px-4 flex items-center justify-between gap-4">
              <span className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                {filter.label}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold",
                isActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
              )}>
                {filter.count}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FilterCardGroup;
