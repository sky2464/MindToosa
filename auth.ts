import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { env } from "@/server/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    ...(env.PLAYWRIGHT_TEST_BACKDOOR_SECRET
      ? [
          Credentials({
            id: "backdoor",
            name: "Test Backdoor",
            credentials: {
              email: { label: "Email", type: "email", placeholder: "agent@example.com" },
              secret: { label: "Secret", type: "password" },
            },
            async authorize(credentials) {
              // Strictly verify the secret against the environment variable
              if (
                credentials?.secret === env.PLAYWRIGHT_TEST_BACKDOOR_SECRET &&
                credentials?.email
              ) {
                return {
                  id: credentials.email as string,
                  email: credentials.email as string,
                  name: "Test Agent",
                };
              }
              return null;
            },
          }),
        ]
      : []),
  ],
  secret: env.NEXTAUTH_SECRET || env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
});
