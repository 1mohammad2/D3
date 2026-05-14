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
  waitingPosition: number | null;
}

export function GameRegistrationActions({ gameId, gameDate, openAt, closeAt, spotsLeft, isRegistered, waitingPosition }: GameRegistrationActionsProps) {
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
  const canRegister = registrationOpen && spotsLeft > 0 && !isRegistered && waitingPosition === null;
  const canJoinWaitlist = registrationOpen && spotsLeft === 0 && waitingPosition === null;

  const handleAction = async (action: 'register' | 'cancel' | 'leave-waitlist') => {
    setLoading(true);
    setError(null);
    setStatusMessage(null);

    const endpoint = action === 'leave-waitlist' ? '/api/games/waitlist/remove' : `/api/games/${action}`;
    const response = await fetch(endpoint, {
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
      ) : waitingPosition !== null ? (
        <div className="space-y-3">
          <div className="rounded-3xl bg-slate-900/80 p-3 text-sm text-slate-200">
            <p className="font-semibold text-white">Waiting list position</p>
            <p className="mt-1 text-lg">{waitingPosition}</p>
          </div>
          <Button variant="ghost" onClick={() => handleAction('leave-waitlist')} disabled={loading}>
            {loading ? 'Processing...' : 'Leave waiting list'}
          </Button>
        </div>
      ) : (
        <Button onClick={() => handleAction('register')} disabled={!(canRegister || canJoinWaitlist) || loading}>
          {loading ? 'Processing...' : canRegister ? 'Reserve spot' : canJoinWaitlist ? 'Join waiting list' : 'Register unavailable'}
        </Button>
      )}

      {statusMessage && <p className="text-sm text-emerald-300">{statusMessage}</p>}
      {error && <p className="text-sm text-orange-300">{error}</p>}
    </div>
  );
}
