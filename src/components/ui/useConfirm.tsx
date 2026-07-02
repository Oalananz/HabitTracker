'use client';

import { useCallback, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

/**
 * Promise-based replacement for window.confirm() that renders the
 * app's styled ConfirmDialog. Usage:
 *   const { confirm, ConfirmDialog: Dialog } = useConfirm();
 *   if (await confirm({ message: 'Delete this?' })) { ... }
 *   return <>{Dialog}...</>
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    resolver?.(true);
    setOptions(null);
    setResolver(null);
  };

  const handleCancel = () => {
    resolver?.(false);
    setOptions(null);
    setResolver(null);
  };

  const dialog = (
    <ConfirmDialog
      open={!!options}
      title={options?.title}
      message={options?.message || ''}
      confirmLabel={options?.confirmLabel}
      danger={options?.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialog: dialog };
}
