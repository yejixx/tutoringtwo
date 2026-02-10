"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { 
  ArrowLeft,
  User,
  Mail,
  Save,
  CheckCircle,
  CreditCard,
  MapPin,
  Phone,
  Globe,
  Calendar,
  GraduationCap,
  Settings,
  Bell,
  Shield
} from "lucide-react";
import { getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status: authStatus, update: updateSession } = useSession();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    timezone: "",
    preferredLanguage: "English",
  });

  useEffect(() => {
    if (authStatus === "authenticated" && session?.user) {
      setFormData({
        firstName: session.user.firstName || "",
        lastName: session.user.lastName || "",
        email: session.user.email || "",
        phone: (session.user as any).phone || "",
        location: (session.user as any).location || "",
        bio: (session.user as any).bio || "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        preferredLanguage: (session.user as any).preferredLanguage || "English",
      });
      setAvatarUrl(session.user.avatarUrl || undefined);
    } else if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
    }
  }, [authStatus, session]);

  const handleAvatarChange = async (newUrl: string) => {
    setAvatarUrl(newUrl);
    // Avatar is uploaded separately via the avatar component
    await updateSession();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Update the session with new data
        await updateSession();
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (authStatus === "loading") {
    return <PageLoader />;
  }

  const user = session?.user;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
              <p className="text-slate-500">Manage your profile and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">{successMessage}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Photo Card */}
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar
                    src={avatarUrl}
                    fallback={getInitials(user?.firstName || "", user?.lastName || "")}
                    size="xl"
                    editable={true}
                    onUpload={handleAvatarChange}
                  />
                  <h2 className="mt-4 text-xl font-semibold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-slate-500 text-sm">{user?.email}</p>
                  <Badge variant="secondary" className="mt-2 capitalize">
                    {user?.role?.toLowerCase()}
                  </Badge>
                  
                  <div className="w-full mt-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user?.role === "TUTOR" && (
                  <>
                    <Link href="/tutor/onboarding" className="block">
                      <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                        <GraduationCap className="h-4 w-4 mr-3" />
                        Edit Tutor Profile
                      </Button>
                    </Link>
                    <Link href="/tutor/stripe" className="block">
                      <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                        <CreditCard className="h-4 w-4 mr-3" />
                        Payment Settings
                      </Button>
                    </Link>
                  </>
                )}
                <Link href="/bookings" className="block">
                  <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                    <Calendar className="h-4 w-4 mr-3" />
                    My Bookings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">Personal Information</CardTitle>
                    <CardDescription className="text-slate-500">Update your personal details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="bg-white border-slate-200"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="bg-white border-slate-200"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 bg-white border-slate-200"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone & Location Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pl-10 bg-white border-slate-200"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium text-slate-700">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="pl-10 bg-white border-slate-200"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium text-slate-700">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="bg-white border-slate-200 min-h-[100px] resize-none"
                      placeholder="Tell us a bit about yourself..."
                    />
                    <p className="text-xs text-slate-400">Brief description for your profile. URLs are hyperlinked.</p>
                  </div>

                  {/* Timezone */}
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-sm font-medium text-slate-700">Timezone</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="timezone"
                        value={formData.timezone}
                        className="pl-10 bg-slate-50 border-slate-200 text-slate-500"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-slate-400">Automatically detected from your browser</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
                      {isSaving ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Bell className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">Notification Preferences</CardTitle>
                    <CardDescription className="text-slate-500">Manage how you receive notifications</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="font-medium text-slate-700">Email Notifications</p>
                      <p className="text-sm text-slate-500">Receive booking updates via email</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="font-medium text-slate-700">Message Alerts</p>
                      <p className="text-sm text-slate-500">Get notified when you receive messages</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-700">Marketing Emails</p>
                      <p className="text-sm text-slate-500">Receive tips and product updates</p>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">Disabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">Security</CardTitle>
                    <CardDescription className="text-slate-500">Manage your account security</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-700">Password</p>
                    <p className="text-sm text-slate-500">Last changed: Never</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
