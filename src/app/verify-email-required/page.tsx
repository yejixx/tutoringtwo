"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { Mail, AlertTriangle, LogOut, RefreshCw } from "lucide-react";

function VerifyEmailRequiredContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleResend = async () => {
    setIsResending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: "success", text: "Verification email sent! Check your inbox." });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send email" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Email Verification Required</CardTitle>
          <CardDescription className="text-base mt-2">
            Please verify your email address to access this feature.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              We sent a verification link to:
            </p>
            <p className="font-medium mt-1">{session?.user?.email}</p>
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.type === "success" 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleResend} 
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              I&apos;ve Verified - Refresh
            </Button>

            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="w-full text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button 
              onClick={handleResend}
              className="text-primary hover:underline"
              disabled={isResending}
            >
              click here to resend
            </button>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailRequiredPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <VerifyEmailRequiredContent />
    </Suspense>
  );
}
