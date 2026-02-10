import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TutorDashboard } from "@/components/dashboard/tutor-dashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {session.user.role === "TUTOR" ? (
          <TutorDashboard user={session.user} />
        ) : (
          <StudentDashboard user={session.user} />
        )}
      </div>
    </div>
  );
}
