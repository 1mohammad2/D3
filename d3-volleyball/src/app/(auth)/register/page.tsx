"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Registration failed.");
        return;
      }

      toast.success("Registration submitted! Waiting for admin approval.");
      router.push("/pending-approval");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-white text-2xl">Join D3</CardTitle>
        <CardDescription className="text-slate-400">
          Create your player account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-slate-300">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="Your full name"
              {...register("fullName")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
            {errors.fullName && <p className="text-red-400 text-sm">{errors.fullName.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register("email")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
            {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              {...register("password")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
            {errors.password && <p className="text-red-400 text-sm">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              {...register("confirmPassword")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
            {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword.message}</p>}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-slate-300">Gender *</Label>
            <div className="flex gap-4">
              {["MALE", "FEMALE"].map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={g}
                    {...register("gender")}
                    className="accent-orange-500"
                  />
                  <span className="text-slate-300 text-sm">{g}</span>
                </label>
              ))}
            </div>
            {errors.gender && <p className="text-red-400 text-sm">{errors.gender.message}</p>}
          </div>

          {/* Skill Level */}
          <div className="space-y-2">
            <Label className="text-slate-300">Skill Level *</Label>
            <select
              {...register("skillLevel")}
              className="w-full rounded-md bg-slate-700 border border-slate-600 text-white p-2 text-sm"
            >
              <option value="">Select your level</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="SETTER">Setter</option>
            </select>
            {errors.skillLevel && <p className="text-red-400 text-sm">{errors.skillLevel.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}