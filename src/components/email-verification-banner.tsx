"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, Mail, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmailVerificationBanner() {
  const { data: session, update } = useSession();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if no session, already verified, or dismissed
  if (!session?.user || (session.user as any).emailVerified || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: "success", text: data.message });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to resend" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <p className="text-sm font-medium text-amber-800">
                Please verify your email address
              </p>
              <p className="text-sm text-amber-700">
                Check your inbox for a verification link.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {message && (
              <span className={`text-xs ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {message.text}
              </span>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={isResending}
              className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-1" />
                  Resend
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
