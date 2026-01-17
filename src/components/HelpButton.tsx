import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOnboarding } from '@/hooks/useOnboarding';

interface HelpButtonProps {
  moduleId: string;
  className?: string;
}

export function HelpButton({ moduleId, className = '' }: HelpButtonProps) {
  const { startTour } = useOnboarding();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full ${className}`}
            onClick={() => startTour(moduleId)}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">Ver tutorial de esta sección</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Ver tutorial de esta sección</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
