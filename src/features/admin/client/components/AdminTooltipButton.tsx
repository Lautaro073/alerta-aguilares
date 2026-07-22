'use client';

import type { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type AdminTooltipButtonProps = {
  label: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean | undefined;
  children: ReactNode;
};

export function AdminTooltipButton({ label, side = 'top', disabled, children }: AdminTooltipButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {disabled ? <span className="inline-flex">{children}</span> : children}
      </TooltipTrigger>
      <TooltipContent side={side}>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
