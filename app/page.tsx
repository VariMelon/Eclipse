import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gradient-to-b from-zinc-50 via-white to-zinc-50 dark:from-black dark:via-zinc-950 dark:to-black px-6 py-12">
      <main className="mx-auto w-full max-w-3xl">
        {/* Hero Section */}
        <section className="space-y-6 text-center mb-12">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-100">
              Eclipse
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Your TTRPG Campaign Companion
            </p>
          </div>

          <p className="text-lg text-zinc-700 dark:text-zinc-300 max-w-2xl mx-auto">
            Eclipse is a delightful companion app designed for tabletop role-playing game enthusiasts. 
            Organize your campaigns, collaborate with players, manage characters, and bring your stories to life.
          </p>
        </section>

        {/* Features Section */}
        <section className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-white dark:text-black flex-shrink-0">
                🎭
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Campaign Management</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Create and manage multiple campaigns with intuitive organization tools.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-white dark:text-black flex-shrink-0">
                👥
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Player Collaboration</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Invite friends, share campaign details, and collaborate seamlessly.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-white dark:text-black flex-shrink-0">
                🎲
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Character Sheets</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Create and track character progression with flexible level tracking.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-white dark:text-black flex-shrink-0">
                📖
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Game Resources</h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Build wikis, document campaign notes, and organize assets for your stories.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!session ? (
          <section className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950 text-center">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Ready to start your adventure?
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Join Eclipse today and connect with your gaming community.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/signin"
                className="rounded-lg border border-zinc-900 px-6 py-3 font-semibold text-zinc-900 hover:bg-zinc-900 hover:text-white transition dark:border-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-black"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg bg-zinc-900 px-6 py-3 font-semibold text-white hover:bg-zinc-800 transition dark:bg-white dark:text-black dark:hover:bg-zinc-100"
              >
                Create Account
              </Link>
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950 text-center">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Welcome back, {session.user?.name}!
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Explore your campaigns, friends, and characters using the navigation above.
            </p>
            <Link
              href="/campaigns"
              className="inline-block rounded-lg bg-zinc-900 px-6 py-3 font-semibold text-white hover:bg-zinc-800 transition dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              Go to Campaigns
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
