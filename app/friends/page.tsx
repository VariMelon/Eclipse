"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Friend = {
  id: string;
  requesterId: string;
  receiverId: string;
  requesterName?: string | null;
  receiverName?: string | null;
  status: string;
};

type Campaign = { id: string; name: string; createdBy: string };

type FriendsResponse = Friend[];

type CampaignsResponse = Campaign[];

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [friendUsername, setFriendUsername] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [messageTarget, setMessageTarget] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadAll() {
    setError("");
    try {
      const [friendsRes, campaignsRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/campaigns"),
      ]);

      const [friendsData, campaignsData] = await Promise.all([
        friendsRes.json(),
        campaignsRes.json(),
      ]);

      setFriends(Array.isArray(friendsData) ? (friendsData as FriendsResponse) : []);
      setCampaigns(Array.isArray(campaignsData) ? (campaignsData as CampaignsResponse) : []);
    } catch {
      setError("Failed to load friends data.");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function addFriend(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: friendUsername }),
    });
    if (!res.ok) {
      setError("Failed to add friend.");
      return;
    }
    setFriendUsername("");
    await loadAll();
  }

  async function addToCampaign(friend: Friend) {
    if (!selectedCampaignId) {
      setError("Select a campaign first.");
      return;
    }
    setError("");
    const targetId = friend.requesterId;
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
      setError("Failed to add friend to campaign.");
      return;
    }
    await loadAll();
  }

  function sendMessage(e: FormEvent) {
    e.preventDefault();
    setNotice("Messaging is coming soon.");
    setMessageBody("");
  }

  const campaignOptions = useMemo(
    () => campaigns.filter((campaign) => campaign.createdBy),
    [campaigns],
  );

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Friends</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Manage friends, invite them to campaigns, and prepare for messaging.
          </p>
        </header>

        {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {notice ? <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">{notice}</p> : null}

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Add a friend</h2>
          <form onSubmit={addFriend} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              placeholder="Friend username"
              className="flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              required
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Add friend
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Friend list</h2>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Select a campaign you created</option>
              {campaignOptions.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 space-y-3">
            {friends.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No friends yet.</p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {friend.requesterName || friend.requesterId} → {friend.receiverName || friend.receiverId}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Status: {friend.status}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCampaign(friend)}
                    className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-200"
                  >
                    Add to campaign
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Messaging</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Messaging will be available soon. For now, you can plan conversations here.
          </p>
          <form onSubmit={sendMessage} className="mt-4 grid gap-3">
            <input
              value={messageTarget}
              onChange={(e) => setMessageTarget(e.target.value)}
              placeholder="Friend username"
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Write a message..."
              rows={4}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="submit"
              className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Save draft
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
