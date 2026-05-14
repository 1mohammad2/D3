'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionTitle } from '@/components/ui/section-title';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

type LoginValues = z.infer<typeof loginSchema>;

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (values: LoginValues) => {
    setError(null);
    const result = await signIn('credentials', {
      redirect: false,
      email: values.email,
      password: values.password
    });

    if (result?.error) {
      setError('Unable to sign in. Ensure your account is approved and credentials are correct.');
    } else {
      window.location.assign('/');
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,128,0,0.18),_transparent_35%),linear-gradient(180deg,_#040814_0%,_#02040b_100%)] px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <SectionTitle title="Player sign in" subtitle="Access your D3 dashboard once your account is approved by your admin." />

        <Card className="mt-10 p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="your@email.com" />
              {errors.email && <p className="mt-2 text-sm text-orange-300">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} placeholder="Your password" />
              {errors.password && <p className="mt-2 text-sm text-orange-300">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          {error && <div className="mt-6 rounded-3xl border border-orange-400/20 bg-orange-500/10 p-4 text-orange-200">{error}</div>}
        </Card>
      </div>
    </main>
  );
}
