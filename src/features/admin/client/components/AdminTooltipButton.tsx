'use client';

import type { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type AdminTooltipButtonProps = {
  label: string;
  disabled?: boolean | undefined;
  children: ReactNode;
};

export function AdminTooltipButton({ label, disabled, children }: AdminTooltipButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {disabled ? <span className="inline-flex">{children}</span> : children}
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
