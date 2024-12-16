import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      role?: string | null;
      _id?: string | null;
    };
  }

  interface User {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    _id?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: {
      name?: string | null;
      email?: string | null;
      role?: string | null;
      _id?: string | null;
    };
  }
}
