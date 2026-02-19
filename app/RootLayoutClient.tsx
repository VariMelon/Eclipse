"use client";

import { SessionProvider } from "next-auth/react";
import NavBar from "./NavBar";
import PwaRegister from "./PwaRegister";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PwaRegister />
      <NavBar />
      {children}
    </SessionProvider>
  );
}
