import Link from "next/link";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PendingApprovalPage() {
  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm text-center">
      <CardContent className="pt-8 pb-8 space-y-4">
        <div className="flex justify-center">
          <div className="bg-orange-500/20 rounded-full p-4">
            <Clock className="h-12 w-12 text-orange-400" />
          </div>
        </div>
        <h2 className="text-white text-xl font-bold">Pending Admin Approval</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Your registration has been submitted successfully.<br />
          The admin will review your account shortly.<br />
          You&apos;ll be able to login once approved.
        </p>
        <Button asChild variant="outline" className="border-slate-600 text-slate-300">
          <Link href="/login">Back to Login</Link>
        </Button>
      </CardContent>
    </Card>
  );
}