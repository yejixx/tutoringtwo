"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  ArrowLeft,
  Banknote
} from "lucide-react";

interface StripeStatus {
  connected: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

function TutorStripeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const success = searchParams.get("success") === "true";
  const refresh = searchParams.get("refresh") === "true";

  useEffect(() => {
    if (authStatus === "authenticated") {
      if (session?.user?.role !== "TUTOR") {
        router.push("/dashboard");
        return;
      }
      fetchStripeStatus();
    } else if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/tutor/stripe");
    }
  }, [authStatus, session]);

  useEffect(() => {
    if (success || refresh) {
      // Refresh status after returning from Stripe
      fetchStripeStatus();
      // Clear URL params
      router.replace("/tutor/stripe");
    }
  }, [success, refresh]);

  const fetchStripeStatus = async () => {
    try {
      const response = await fetch("/api/tutor/stripe");
      const data = await response.json();
      if (response.ok) {
        setStripeStatus(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch Stripe status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/tutor/stripe", {
        method: "POST",
      });
      const data = await response.json();
      
      if (response.ok && data.data.url) {
        window.location.href = data.data.url;
      } else {
        alert(data.error || "Failed to start Stripe onboarding");
        setIsConnecting(false);
      }
    } catch (error) {
      console.error("Failed to connect Stripe:", error);
      alert("Failed to start Stripe onboarding");
      setIsConnecting(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      const response = await fetch("/api/tutor/stripe/dashboard", {
        method: "POST",
      });
      const data = await response.json();
      
      if (response.ok && data.data.url) {
        window.open(data.data.url, "_blank");
      } else {
        alert(data.error || "Failed to open Stripe dashboard");
      }
    } catch (error) {
      console.error("Failed to open dashboard:", error);
      alert("Failed to open Stripe dashboard");
    }
  };

  if (authStatus === "loading" || isLoading) {
    return <PageLoader />;
  }

  const isFullySetup = stripeStatus?.chargesEnabled && stripeStatus?.payoutsEnabled;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link 
        href="/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payment Settings</h1>
        <p className="text-muted-foreground mt-1">
          Connect your Stripe account to receive payments for tutoring sessions
        </p>
      </div>

      {success && (
        <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">Stripe account connected successfully!</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Stripe Connect</CardTitle>
              <CardDescription>
                Receive payments directly to your bank account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!stripeStatus?.connected ? (
            <>
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Why connect Stripe?</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    Receive payments directly to your bank account
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    Automatic payouts after each session
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    Secure payment processing
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    View earnings and payout history
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handleConnectStripe}
                disabled={isConnecting}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  "Connecting..."
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Connect Stripe Account
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Banknote className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Account Status</p>
                      <p className="text-sm text-muted-foreground">
                        {stripeStatus.accountId?.substring(0, 20)}...
                      </p>
                    </div>
                  </div>
                  {isFullySetup ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Incomplete
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      {stripeStatus.chargesEnabled ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="font-medium text-sm">Charges</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stripeStatus.chargesEnabled ? "Enabled" : "Not enabled"}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      {stripeStatus.payoutsEnabled ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="font-medium text-sm">Payouts</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stripeStatus.payoutsEnabled ? "Enabled" : "Not enabled"}
                    </p>
                  </div>
                </div>

                {!isFullySetup && (
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Complete your Stripe setup
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Your Stripe account needs additional information before you can receive payments.
                        </p>
                        <Button
                          onClick={handleConnectStripe}
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          disabled={isConnecting}
                        >
                          {isConnecting ? "Loading..." : "Complete Setup"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {isFullySetup && (
                  <Button
                    onClick={handleOpenDashboard}
                    variant="outline"
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Stripe Dashboard
                  </Button>
                )}
              </div>
            </>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Platform fee: 15% per booking. Payouts are processed automatically by Stripe.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TutorStripePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TutorStripeContent />
    </Suspense>
  );
}
