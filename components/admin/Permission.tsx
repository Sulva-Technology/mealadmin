'use client';

import { type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useSession } from '@/lib/session';
import { canPerform, permissionMessage, type AdminAction } from '@/lib/rbac';
import { Button } from '@/components/ui/Button';

type ButtonProps = React.ComponentProps<typeof Button>;

export function PermissionAction({
  action,
  children,
  disabled,
  title,
  ...props
}: ButtonProps & { action: AdminAction; children: ReactNode }) {
  const { session } = useSession();
  const allowed = canPerform(session, action);
  const message = title ?? permissionMessage(action);

  return (
    <Button
      {...props}
      disabled={disabled || !allowed}
      title={allowed ? title : message}
      aria-disabled={disabled || !allowed}
    >
      {!allowed && <Lock className="w-4 h-4" />}
      {children}
    </Button>
  );
}
