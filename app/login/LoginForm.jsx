"use client";

import { useActionState } from "react";
import SwalMessageEffect from "../../components/SwalMessageEffect";
import { loginAction } from "./actions";

const initialState = {
  error: "",
};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form className="grid gap-[18px] mt-[34px]" action={formAction}>
      <SwalMessageEffect message={state?.error} type="error" />
      <div className="grid gap-2.5">
        <label className="text-[14px] font-semibold" htmlFor="email">Admin email</label>
        <input
          autoComplete="email"
          id="email"
          name="email"
          required
          type="email"
          className="w-full border border-fjord-ink/10 rounded-[18px] bg-white/92 px-[18px] py-4 text-fjord-ink outline-none transition-all duration-[160ms] focus:border-fjord-ink/25 focus:ring-4 focus:ring-fjord-ink/6"
        />
      </div>

      <div className="grid gap-2.5">
        <label className="text-[14px] font-semibold" htmlFor="password">Password</label>
        <input
          autoComplete="current-password"
          id="password"
          name="password"
          required
          type="password"
          className="w-full border border-fjord-ink/10 rounded-[18px] bg-white/92 px-[18px] py-4 text-fjord-ink outline-none transition-all duration-[160ms] focus:border-fjord-ink/25 focus:ring-4 focus:ring-fjord-ink/6"
        />
      </div>

      <button className="w-full flex justify-center items-center rounded-full px-[18px] py-3 border border-transparent bg-fjord-accent text-white font-semibold transition hover:bg-opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer" disabled={isPending} type="submit">
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
