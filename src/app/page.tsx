import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  Search,
  Calendar,
  Star,
  Shield,
  Users,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Find the Perfect Tutor",
    description: "Browse hundreds of qualified tutors across all subjects and skill levels.",
  },
  {
    icon: Calendar,
    title: "Flexible Scheduling",
    description: "Book sessions that fit your schedule with our easy-to-use calendar system.",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Safe and secure payment processing. Pay only when you're satisfied.",
  },
  {
    icon: Star,
    title: "Verified Reviews",
    description: "Read authentic reviews from students to find the best tutor for you.",
  },
];

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "English",
  "Programming",
  "Spanish",
  "SAT Prep",
  "Music",
];

const stats = [
  { value: "10,000+", label: "Active Tutors" },
  { value: "50,000+", label: "Students" },
  { value: "100,000+", label: "Sessions Completed" },
  { value: "4.9/5", label: "Average Rating" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
              Learn Anything with{" "}
              <span className="text-primary">Expert Tutors</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8">
              Connect with qualified tutors for personalized 1-on-1 lessons. Whether you need help with math, science, languages, or test prep, we have the right tutor for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/tutors">
                <Button size="lg" className="w-full sm:w-auto">
                  <Search className="mr-2 h-5 w-5" />
                  Find a Tutor
                </Button>
              </Link>
              <Link href="/register?role=tutor">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Become a Tutor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
                <div className="text-sm md:text-base text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Subjects */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Popular Subjects</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Explore our most popular subjects and find expert tutors ready to help you succeed.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {subjects.map((subject) => (
              <Link
                key={subject}
                href={`/tutors?subject=${encodeURIComponent(subject)}`}
              >
                <Button variant="secondary" size="lg" className="rounded-full bg-white shadow-sm hover:shadow-md">
                  {subject}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose TutorHub?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              We make it easy to find qualified tutors and book lessons that fit your schedule.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-0 shadow-sm bg-slate-50">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Getting started is easy. Just follow these simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Search for Tutors",
                description: "Browse tutors by subject, price, and availability. Read reviews to find your perfect match.",
                icon: Search,
              },
              {
                step: "2",
                title: "Book a Session",
                description: "Select a time that works for you and book your lesson. Pay securely through our platform.",
                icon: Calendar,
              },
              {
                step: "3",
                title: "Start Learning",
                description: "Meet with your tutor and achieve your learning goals. Leave a review to help others.",
                icon: GraduationCap,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for Tutors */}
      <section className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="p-4 bg-white/10 rounded-2xl w-fit mx-auto mb-6">
              <Users className="h-12 w-12" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Share Your Knowledge
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Join thousands of tutors who are earning money while helping students succeed. Set your own rates, create your own schedule, and teach from anywhere.
            </p>
            <div className="flex flex-wrap gap-6 justify-center mb-8">
              {[
                "Set your own rates",
                "Flexible schedule",
                "Get paid weekly",
                "Teach from anywhere",
              ].map((benefit) => (
                <div key={benefit} className="flex items-center justify-center gap-2 text-sm">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-slate-300">{benefit}</span>
                </div>
              ))}
            </div>
            <Link href="/register?role=tutor">
              <Button size="lg" variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
                Start Tutoring Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
