import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { getCurrentAdminSession } from "../../lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Login | Futuremilestone",
  description: "Secure login for the Futuremilestone admin panel.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage() {
  const session = await getCurrentAdminSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen p-2 sm:p-3 grid place-items-center">
      <div className="w-full max-w-[720px]">
        <section className="rounded-[36px] shadow-fjord-soft overflow-hidden p-6 sm:p-9 bg-fjord-panel border border-white/70 backdrop-blur-[18px]">
          <span className="block text-fjord-muted text-[12px] tracking-[0.14em] uppercase">Admin sign in</span>
          <h2 className="mt-2.5 mb-2 text-[36px] font-bold tracking-[-0.07em] leading-tight">Welcome back.</h2>
          <p className="m-0 text-fjord-muted leading-[1.7]">Enter your administrator credentials to continue.</p>

          <LoginForm />
        </section>
      </div>
    </div>
  );
}
