import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/user";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const result = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/log-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
            authenticationType: "credentials",
          }),
        });
        const res = await result.json();
        if (!res.ok) {
          return null;
        }
        return res.user;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectToDatabase();
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            await User.create({
              name: user.name,
              email: user.email,
              password: Math.random().toString(36).slice(-8),
              role: "user",
            });
          }
        } catch (error) {
          console.error("Error during user sync:", error);
          return false;
        }
      }
      return true;
    },
    async redirect({ baseUrl }) {
      return baseUrl + "/all-resumes";
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = {
          ...session.user,
          role: token.user.role,
          _id: token.user._id,
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          ...user,
          role: user.role,
          _id: user._id,
        };
      }
      return token;
    },
  },
  pages: { signIn: "/log-in" },
  session: { strategy: "jwt" },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
