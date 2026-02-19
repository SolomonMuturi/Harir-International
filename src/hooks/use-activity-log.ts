// hooks/use-activity-log.ts
import { useCallback } from 'react';
import { toast } from 'sonner';

interface ActivityLogOptions {
  action: string;
  status?: 'success' | 'failure' | 'pending';
  metadata?: any;
  silent?: boolean;
}

export function useActivityLog() {
  const logActivity = useCallback(async ({
    action,
    status = 'success',
    metadata = {},
    silent = false
  }: ActivityLogOptions) => {
    try {
      // Get user info from localStorage or context
      const user = localStorage.getItem('user') ? 
        JSON.parse(localStorage.getItem('user') || '{}') : null;
      
      // Get IP address (optional - you might want to get this server-side)
      const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => null);
      const ip = ipResponse ? (await ipResponse.json()).ip : null;

      const response = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: user?.name || 'System',
          avatar: user?.avatar || null,
          action,
          ip,
          timestamp: new Date().toISOString(),
          status,
          metadata,
        }),
      });

      if (!response.ok) {
        console.error('Failed to log activity:', await response.text());
      }

      // Show toast notification for failures unless silent
      if (status === 'failure' && !silent) {
        toast.error(`Action failed: ${action}`, {
          description: metadata?.error || 'An error occurred',
        });
      }

    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, []);

  return { logActivity };
}