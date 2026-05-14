'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionTitle } from '@/components/ui/section-title';

const registerSchema = z.object({
  name: z.string().min(3, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(8, 'Phone number is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'SETTER']),
  setterStatus: z.boolean().optional()
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gender: 'MALE',
      skillLevel: 'BEGINNER',
      setterStatus: false
    }
  });

  const onSubmit = async (values: RegisterValues) => {
    setMessage(null);
    setError(null);

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });

    const data = await response.json();
    if (response.ok) {
      setMessage(data.message);
    } else {
      setError(data.error ?? 'Unable to submit registration.');
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,128,0,0.18),_transparent_35%),linear-gradient(180deg,_#040814_0%,_#02040b_100%)] px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <SectionTitle
          title="Player registration"
          subtitle="Secure your spot in the next volleyball game. Admin approval is required before access." 
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="space-y-6">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" {...register('name')} placeholder="Sami Al-Hassan" />
                {errors.name && <p className="mt-2 text-sm text-orange-300">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="your@email.com" />
                {errors.email && <p className="mt-2 text-sm text-orange-300">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} placeholder="Create a strong password" />
                {errors.password && <p className="mt-2 text-sm text-orange-300">{errors.password.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" {...register('phone')} placeholder="+966 5X XXX XXXX" />
                {errors.phone && <p className="mt-2 text-sm text-orange-300">{errors.phone.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select id="gender" className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none" {...register('gender')}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="skillLevel">Skill level</Label>
                  <select id="skillLevel" className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none" {...register('skillLevel')}>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                    <option value="SETTER">Setter</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input id="setterStatus" type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-orange-500 focus:ring-orange-400" {...register('setterStatus')} />
                <Label htmlFor="setterStatus">I am a setter or play setter role</Label>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Request approval'}
              </Button>
            </form>
            {message && <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-emerald-200">{message}</div>}
            {error && <div className="rounded-3xl border border-orange-400/20 bg-orange-500/10 p-4 text-orange-200">{error}</div>}
          </Card>

          <Card className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-orange-300">How it works</p>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
                <p>1. Submit your player profile with skill level and phone number.</p>
                <p>2. Admin reviews your request and activates your account.</p>
                <p>3. When registration opens, you can claim your spot or join the waiting list.</p>
                <p>4. D3 will track attendance, warnings, and rankings automatically.</p>
              </div>
            </div>
            <div className="rounded-3xl border border-orange-500/15 bg-slate-950/80 p-6">
              <h3 className="text-xl font-semibold text-white">Already registered?</h3>
              <p className="mt-3 text-slate-400">Sign in to manage your profile, view upcoming games, and check the leaderboard.</p>
              <Button variant="secondary" className="mt-6 w-full" onClick={() => window.location.assign('/auth/signin')}>
                Go to Sign in
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
