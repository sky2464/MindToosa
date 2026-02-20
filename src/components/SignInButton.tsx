"use client";

import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/today" })}
      className="text-xs font-semibold tracking-widest text-zinc-600 uppercase transition hover:text-zinc-400"
    >
      Sign In with Google
    </button>
  );
}
