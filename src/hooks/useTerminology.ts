import { useMemo } from 'react';
import { getBusinessConfig, terminology } from '@/lib/businessConfig';

export function useTerminology() {
  const config = getBusinessConfig();
  
  return useMemo(() => terminology[config.type], [config.type]);
}

export function useBusinessConfig() {
  return getBusinessConfig();
}
