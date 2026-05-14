'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface ApprovalActionsProps {
  userId: string;
}

export function ApprovalActions({ userId }: ApprovalActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/admin/users/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    const result = await response.json();
    if (!response.ok) {
      setError(result.error || 'Unable to complete action.');
      setLoading(false);
      return;
    }

    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => handleAction('approve')} disabled={loading}>
        Approve
      </Button>
      <Button variant="ghost" size="sm" onClick={() => handleAction('reject')} disabled={loading}>
        Reject
      </Button>
      {error ? <p className="text-sm text-orange-300">{error}</p> : null}
    </div>
  );
}
