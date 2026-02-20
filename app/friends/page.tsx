"use client";

export const dynamic = "force-dynamic";

import { FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Friend = {
  id: string;
  requesterId: string;
  receiverId: string;
  requesterName?: string | null;
  receiverName?: string | null;
  friendId?: string | null;
  friendName?: string | null;
  friendCampaigns?: { id: string; name: string }[];
  status: string;
};

type Notification = {
  id: string;
  type: 'friendRequest' | 'campaignInvite';
  from: {
    id: string;
    name: string;
  };
  createdAt: string;
  data?: {
    campaignId?: string;
    campaignName?: string;
    campaignSubtitle?: string | null;
    campaignSystem?: string | null;
    role?: string;
  };
};

export default function FriendsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friendUsername, setFriendUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState(false);
  const [processingNotification, setProcessingNotification] = useState<string | null>(null);

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
      const [friendsRes, notificationsRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/notifications"),
      ]);
      
      const friendsData = await friendsRes.json();
      setFriends(Array.isArray(friendsData) ? friendsData : []);
      
      const notificationsData = await notificationsRes.json();
      setNotifications(Array.isArray(notificationsData.notifications) ? notificationsData.notifications : []);
    } catch (err) {
      setError("Failed to load data.");
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
      setSuccess("Friend request sent!");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add friend");
    } finally {
      setAddingFriend(false);
    }
  }

  async function handleNotification(notificationId: string, type: string, action: 'accept' | 'decline') {
    setError("");
    setSuccess("");
    setProcessingNotification(notificationId);

    try {
      const res = await fetch("/api/notifications/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, type, action }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to process notification");
      }

      const result = await res.json();
      setSuccess(result.message || `Notification ${action}ed successfully!`);
      await loadAll();
      
      // If campaign invite accepted, redirect to campaigns page
      if (type === 'campaignInvite' && action === 'accept') {
        setTimeout(() => router.push('/campaigns'), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process notification");
    } finally {
      setProcessingNotification(null);
    }
  }

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

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <section className="mb-10 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
              Notifications ({notifications.length})
            </h2>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border border-blue-200 bg-white p-4 dark:border-blue-800 dark:bg-zinc-900"
                >
                  <div className="flex-1">
                    {notification.type === 'friendRequest' && (
                      <>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          Friend Request from {notification.from.name}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                          {notification.from.name} wants to be your friend.
                        </p>
                      </>
                    )}
                    {notification.type === 'campaignInvite' && (
                      <>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          Campaign Invitation: {notification.data?.campaignName}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                          {notification.from.name} invited you to join as {notification.data?.role}
                          {notification.data?.campaignSubtitle && ` • ${notification.data.campaignSubtitle}`}
                          {notification.data?.campaignSystem && ` • ${notification.data.campaignSystem}`}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleNotification(notification.id, notification.type, 'accept')}
                      disabled={processingNotification === notification.id}
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-600"
                    >
                      {processingNotification === notification.id ? "..." : "Accept"}
                    </button>
                    <button
                      onClick={() => handleNotification(notification.id, notification.type, 'decline')}
                      disabled={processingNotification === notification.id}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
                    >
                      {processingNotification === notification.id ? "..." : "Decline"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Add Friend Section */}
        <section className="mb-10 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Send Friend Request</h2>
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
              {addingFriend ? "Sending..." : "Send Request"}
            </button>
          </form>
        </section>

        {/* Friends List Section */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Your Friends</h2>
          </div>

          {friends.filter(f => f.status === 'ACCEPTED').length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No friends yet. Send a friend request above to get started!</p>
          ) : (
            <div className="space-y-3">
              {friends.filter(f => f.status === 'ACCEPTED').map((friend) => (
                <div
                  key={friend.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {friend.friendName || friend.friendId}
                    </p>
                    {friend.friendCampaigns && friend.friendCampaigns.length > 0 ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <span>Campaigns:</span>
                        {friend.friendCampaigns.map((campaign) => (
                          <Link
                            key={campaign.id}
                            href={`/campaigns/${campaign.id}`}
                            className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                          >
                            {campaign.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">No shared campaigns</p>
                    )}
                  </div>
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
