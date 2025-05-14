
"use client";

import type { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Minus, Square, X } from 'lucide-react';
import { cn } from "@/lib/utils"; // Ensure cn is imported

interface WindowProps {
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function Window({ title, children, className, icon }: WindowProps) {
  return (
    <Card className={cn("border-2 border-foreground/50 shadow-lg flex flex-col bg-card text-card-foreground rounded-sm overflow-hidden", className)}>
      <CardHeader className="bg-secondary/40 p-2 flex flex-row items-center justify-between border-b-2 border-foreground/50 cursor-default select-none">
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-primary flex-shrink-0">{icon}</span>}
          <CardTitle className="text-sm font-semibold text-primary truncate">{title}</CardTitle>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button className="p-0.5 border border-foreground/50 hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring rounded-sm" aria-label="Minimize window">
            <Minus size={14} className="text-foreground/80" />
          </button>
          <button className="p-0.5 border border-foreground/50 hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring rounded-sm" aria-label="Maximize window">
            <Square size={14} className="text-foreground/80" />
          </button>
          <button className="p-0.5 border border-foreground/50 bg-destructive/70 hover:bg-destructive focus:outline-none focus:ring-1 focus:ring-ring rounded-sm" aria-label="Close window">
            <X size={14} className="text-destructive-foreground" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow overflow-auto custom-scrollbar">
        {children}
      </CardContent>
    </Card>
  );
}

// The cn function might already be in @/lib/utils, if not, it's:
// const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');
// But it's better to ensure it's imported from utils.
