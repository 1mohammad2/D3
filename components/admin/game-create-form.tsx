'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidGameDate } from '@/lib/game';
import { useRouter } from 'next/navigation';

const createGameSchema = z.object({
  date: z.string().min(1, 'Please select a date and time').refine((value) => {
    const date = new Date(value);
    return isValidGameDate(date) && date > new Date();
  }, 'Choose a future Wednesday, Friday, or Sunday at 20:30.')
});

type FormValues = z.infer<typeof createGameSchema>;

export function GameCreateForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(createGameSchema)
  });

  const onSubmit = async (values: FormValues) => {
    setMessage(null);
    setError(null);

    const response = await fetch('/api/admin/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to create game.');
      return;
    }

    setMessage('Game created successfully.');
    router.refresh();
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="date">Game date and time</Label>
        <Input id="date" type="datetime-local" step="900" {...register('date')} />
        {errors.date && <p className="mt-2 text-sm text-orange-300">{errors.date.message}</p>}
      </div>
      <p className="text-sm text-slate-400">Select Wednesday, Friday, or Sunday at 20:30 only.</p>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create game'}
      </Button>
      {message && <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-emerald-200">{message}</div>}
      {error && <div className="rounded-3xl border border-orange-400/20 bg-orange-500/10 p-4 text-orange-200">{error}</div>}
    </form>
  );
}
