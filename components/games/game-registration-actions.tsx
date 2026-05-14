'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface GameRegistrationActionsProps {
  gameId: string;
  gameDate: string;
  openAt: string;
  closeAt: string;
  spotsLeft: number;
  isRegistered: boolean;
}

export function GameRegistrationActions({ gameId, gameDate, openAt, closeAt, spotsLeft, isRegistered }: GameRegistrationActionsProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const currentTime = useMemo(() => new Date(), []);
  const openAtDate = new Date(openAt);
  const closeAtDate = new Date(closeAt);
  const gameDateTime = new Date(gameDate);

  const registrationOpen = currentTime >= openAtDate && currentTime < gameDateTime;
  const cancellationAllowed = currentTime < closeAtDate && isRegistered;
  const canRegister = registrationOpen && spotsLeft > 0 && !isRegistered;

  const handleAction = async (action: 'register' | 'cancel') => {
    setLoading(true);
    setError(null);
    setStatusMessage(null);

    const response = await fetch(`/api/games/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Unable to process request.');
      setLoading(false);
      return;
    }

    setStatusMessage(action === 'register' ? 'Registration confirmed.' : 'Cancellation completed.');
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-950/80 p-5">
      <p className="text-sm text-slate-300">{registrationOpen ? 'Registration is open now.' : 'Registration is not open yet.'}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-slate-900/80 p-3 text-sm text-slate-300">
          <p className="font-semibold text-white">Spots left</p>
          <p className="mt-1 text-lg">{spotsLeft}</p>
        </div>
        <div className="rounded-3xl bg-slate-900/80 p-3 text-sm text-slate-300">
          <p className="font-semibold text-white">Cancel before</p>
          <p className="mt-1 text-lg">{closeAtDate.toLocaleString()}</p>
        </div>
      </div>

      {isRegistered ? (
        <Button variant="ghost" onClick={() => handleAction('cancel')} disabled={!cancellationAllowed || loading}>
          {loading ? 'Processing...' : cancellationAllowed ? 'Cancel registration' : 'Cancellation locked'}
        </Button>
      ) : (
        <Button onClick={() => handleAction('register')} disabled={!canRegister || loading}>
          {loading ? 'Processing...' : spotsLeft === 0 ? 'Game full' : 'Reserve spot'}
        </Button>
      )}

      {statusMessage && <p className="text-sm text-emerald-300">{statusMessage}</p>}
      {error && <p className="text-sm text-orange-300">{error}</p>}
    </div>
  );
}
