"use client";

import type { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Minus, Square, X } from 'lucide-react';

interface WindowProps {
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function Window({ title, children, className, icon }: WindowProps) {
  return (
    <Card className={cn("border-2 border-foreground/50 shadow-md flex flex-col bg-card text-card-foreground", className)}>
      <CardHeader className="bg-secondary/30 p-2 flex flex-row items-center justify-between border-b-2 border-foreground/50 cursor-default">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          <CardTitle className="text-sm font-bold text-primary select-none">{title}</CardTitle>
        </div>
        <div className="flex items-center space-x-1">
          <button className="p-0.5 border border-foreground/50 hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring">
            <Minus size={14} className="text-foreground/80" />
          </button>
          <button className="p-0.5 border border-foreground/50 hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring">
            <Square size={14} className="text-foreground/80" />
          </button>
          <button className="p-0.5 border border-foreground/50 bg-destructive/70 hover:bg-destructive focus:outline-none focus:ring-1 focus:ring-ring">
            <X size={14} className="text-destructive-foreground" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow overflow-auto">
        {children}
      </CardContent>
    </Card>
  );
}

// Helper to use cn if not already available in this file's scope
// (though typically it would be via "@/lib/utils")
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');
