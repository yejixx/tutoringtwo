"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { 
  GraduationCap, 
  Menu, 
  X, 
  Home, 
  Search, 
  Calendar, 
  DollarSign,
  Settings,
  LogOut,
  User,
  MessageSquare,
  Edit,
  Eye
} from "lucide-react";
import { useState } from "react";

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = status === "authenticated";
  const user = session?.user;

  const navLinks = isAuthenticated
    ? user?.role === "TUTOR"
      ? [
          { href: "/dashboard", label: "Dashboard", icon: Home },
          { href: "/tutor/profile", label: "My Profile", icon: Eye },
          { href: "/tutor/availability", label: "Availability", icon: Calendar },
          { href: "/bookings", label: "Bookings", icon: Calendar },
          { href: "/messages", label: "Messages", icon: MessageSquare },
          { href: "/tutor/stripe", label: "Payments", icon: DollarSign },
        ]
      : [
          { href: "/dashboard", label: "Dashboard", icon: Home },
          { href: "/tutors", label: "Find Tutors", icon: Search },
          { href: "/bookings", label: "My Bookings", icon: Calendar },
          { href: "/messages", label: "Messages", icon: MessageSquare },
        ]
    : [
        { href: "/tutors", label: "Find Tutors", icon: Search },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="p-1.5 bg-primary rounded-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">TutorHub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === link.href
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons / User Menu */}
        <div className="hidden md:flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <Link 
                href="/profile" 
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Avatar
                  src={user.avatarUrl}
                  fallback={getInitials(user.firstName, user.lastName)}
                  size="sm"
                />
                <span className="text-sm font-medium text-slate-700">
                  {user.firstName}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-slate-600 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900">Log in</Button>
              </Link>
              <Link href="/register">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-slate-600" />
          ) : (
            <Menu className="h-6 w-6 text-slate-600" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <nav className="container mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                    pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
            
            <hr className="my-4 border-slate-200" />
            
            {isAuthenticated && user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Profile</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="font-medium">Log in</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full mt-2">Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
