"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginAction } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isPending, startTransition] = useTransition();

  // useSession().update() هي المفتاح — بتجبر SessionProvider يجيب الجلسة الجديدة فوراً
  const { update } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      const result = await loginAction(data.email, data.password);

      if (!result) return;

      switch (result.error) {
        case "BANNED":
          toast.error("Your account has been banned. Contact the admin.");
          return;

        case "PENDING_APPROVAL":
          toast.error("Your account is pending admin approval.");
          router.push("/pending-approval");
          return;

        case "INVALID":
          toast.error("Invalid email or password.");
          return;

        case "DB_ERROR":
          toast.error("Service temporarily unavailable. Please try again in a moment.");
          return;

        case "UNKNOWN":
          toast.error("Something went wrong. Please try again.");
          return;

        case null:
          // تسجيل الدخول نجح — الـ Cookie انضبط من السيرفر،
          // الآن لازم نحدّث الـ Session context يدوياً قبل التنقل
          await update();
          router.push(callbackUrl);
          router.refresh();
          return;
      }
    });
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-white text-2xl">Welcome Back</CardTitle>
        <CardDescription className="text-slate-400">
          Sign in to your D3 account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register("email")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
            {errors.email && (
              <p className="text-red-400 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
            {errors.password && (
              <p className="text-red-400 text-sm">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-5"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-4">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-orange-400 hover:text-orange-300 font-medium"
          >
            Register here
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}