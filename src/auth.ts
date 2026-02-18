import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { env } from "@/server/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: env.NEXTAUTH_SECRET || env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
});
