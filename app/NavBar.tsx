"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface Campaign {
  id: string;
  name: string;
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const currentPath = pathname || "/";
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userCampaigns, setUserCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (session?.user) {
      // Fetch user's campaigns for the dropdown menu
      fetch("/api/campaigns")
        .then((res) => res.json())
        .then((data) => {
          if (data.campaigns) {
            setUserCampaigns(data.campaigns.slice(0, 5)); // Show top 5
          }
        })
        .catch(() => {
          // Silently fail
        });
    }
  }, [session]);

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/");
  }

  const navLinks = [
    { href: "/resources", label: "Resources" },
    { href: "/campaigns", label: "Campaigns" },
    { href: "/characters", label: "Characters" },
    { href: "/systems", label: "Systems" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  return (
    <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="mx-auto w-full max-w-7xl px-6 py-4">
        <div className="relative flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
              E
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Eclipse</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">TTRPG Hub</p>
            </div>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive(link.href)
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section: User Menu or Auth */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  <span className="hidden sm:inline">{session.user.name}</span>
                  <svg
                    className={`h-4 w-4 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    {/* User Info */}
                    <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
                      <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                        Account
                      </p>
                      <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
                        {session.user.name}
                      </p>
                    </div>

                    {/* My Info Link */}
                    <Link
                      href="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      My Info
                    </Link>

                    <Link
                      href="/friends"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Friends
                    </Link>

                    {/* Password Reset */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // TODO: Implement password reset flow
                        router.push("/auth/reset-password");
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Change Password
                    </button>

                    {/* Campaigns (if any) */}
                    {userCampaigns.length > 0 && (
                      <>
                        <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
                          <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                            Your Campaigns
                          </p>
                        </div>
                        {userCampaigns.map((campaign) => (
                          <Link
                            key={campaign.id}
                            href={`/campaigns/${campaign.id}`}
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            {campaign.name}
                          </Link>
                        ))}
                      </>
                    )}

                    {/* Sign Out */}
                    <div className="border-t border-zinc-200 dark:border-zinc-700">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleSignOut();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signin"
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-3 flex flex-wrap gap-1.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                isActive(link.href)
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
