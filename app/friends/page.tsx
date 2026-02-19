"use client";

export const dynamic = "force-dynamic";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Friend = {
  id: string;
  requesterId: string;
  receiverId: string;
  requesterName?: string | null;
  receiverName?: string | null;
  friendId?: string | null;
  friendName?: string | null;
  status: string;
};

type Campaign = { id: string; name: string; createdBy: string };

export default function FriendsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const currentUserId = session?.user?.email; // We'll use email as a fallback; ideally we'd have user ID in session
  const [friends, setFriends] = useState<Friend[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [friendUsername, setFriendUsername] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      loadAll();
    }
  }, [status, router]);

  async function loadAll() {
    setError("");
    setLoading(true);
    try {
      const [friendsRes, campaignsRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/campaigns"),
      ]);

      const [friendsData, campaignsData] = await Promise.all([
        friendsRes.json(),
        campaignsRes.json(),
      ]);

      setFriends(Array.isArray(friendsData) ? friendsData : []);
      setCampaigns(Array.isArray(campaignsData.campaigns) ? campaignsData.campaigns : []);
    } catch (err) {
      setError("Failed to load friends and campaigns.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function addFriend(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setAddingFriend(true);

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: friendUsername }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add friend");
      }

      setFriendUsername("");
      setSuccess("Friend added!");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add friend");
    } finally {
      setAddingFriend(false);
    }
  }

  async function addToCampaign(friend: Friend) {
    if (!selectedCampaignId) {
      setError("Select a campaign first.");
      return;
    }

    setError("");
    // Add the other person in the friendship (not the current user)
    const targetId = friend.friendId;

    try {
      const res = await fetch("/api/campaigns/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          userId: targetId,
          role: "PLAYER",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to add friend to campaign");
      }

      setSuccess("Friend added to campaign!");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add friend to campaign");
    }
  }

  const campaignOptions = useMemo(
    () => campaigns.filter((campaign) => campaign.createdBy),
    [campaigns],
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
        <div className="mx-auto max-w-5xl animate-pulse space-y-4">
          <div className="h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
      <main className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Friends</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Connect with friends and manage campaign invitations
          </p>
        </header>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950 dark:text-green-200">
            {success}
          </div>
        )}

        {/* Add Friend Section */}
        <section className="mb-10 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Add Friend</h2>
          <form onSubmit={addFriend} className="flex flex-col sm:flex-row gap-3">
            <input
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              placeholder="Enter friend's username"
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              required
            />
            <button
              type="submit"
              disabled={addingFriend}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              {addingFriend ? "Adding..." : "Add Friend"}
            </button>
          </form>
        </section>

        {/* Friends List Section */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Your Friends</h2>
            {campaignOptions.length > 0 && (
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Select campaign to add to</option>
                {campaignOptions.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {friends.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No friends yet. Add one above to get started!</p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {friend.friendName || friend.friendId}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      Friends since now • {friend.status}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCampaign(friend)}
                    disabled={!selectedCampaignId}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  >
                    Add to Campaign
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Coming Soon Section */}
        <section className="mt-10 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">Messaging Coming Soon</h2>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            Direct messaging with friends will be available in a future update. For now, use campaign channels to collaborate.
          </p>
        </section>
      </main>
    </div>
  );
}
