"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface CampaignMember {
  id: string;
  userId: string;
  campaignId: string;
  role: "GM" | "MODERATOR" | "PLAYER";
  user: {
    id: string;
    name: string;
  };
}

interface Campaign {
  id: string;
  name: string;
  createdByName?: string;
  createdBy?: string;
}

interface FriendOption {
  id: string;
  friendId?: string | null;
  friendName?: string | null;
}

const ROLE_ORDER = { GM: 0, MODERATOR: 1, PLAYER: 2 };
const ROLE_LABELS = {
  GM: "Game Master",
  MODERATOR: "Moderator",
  PLAYER: "Player",
};

export default function CampaignMembersPage() {
  const { status, data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const campaignId = (Array.isArray(rawId) ? rawId[0] : rawId || "") as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [members, setMembers] = useState<CampaignMember[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<"GM" | "MODERATOR" | "PLAYER" | null>(null);
  const [saving, setSaving] = useState(false);
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && campaignId) {
      loadData();
    }
  }, [status, router, campaignId]);

  async function loadData() {
    if (!campaignId) {
      return;
    }

    setError("");
    setLoading(true);
    try {
      // Load campaign info
      const campaignRes = await fetch(`/api/campaigns/${campaignId}`);
      if (!campaignRes.ok) {
        const errorData = await campaignRes.json().catch(() => null);
        throw new Error(errorData?.message || errorData?.error || "Failed to load campaign");
      }
      const campaignData = await campaignRes.json();
      setCampaign(campaignData);

      const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
      if (campaignData.createdBy && sessionUserId && campaignData.createdBy === sessionUserId) {
        setUserRole("GM");
      }

      // Load members
      const membersRes = await fetch(`/api/campaigns/${campaignId}/members`);
      if (!membersRes.ok) {
        const errorData = await membersRes.json().catch(() => null);
        throw new Error(errorData?.message || errorData?.error || "Failed to load members");
      }
      const membersData = await membersRes.json();
      const membersList = Array.isArray(membersData.members) ? membersData.members : [];
      setMembers(membersList.sort((a: CampaignMember, b: CampaignMember) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]));

      // Get current user's role by comparing user ID
      const userMember = membersList.find((m: CampaignMember) => m.userId === sessionUserId);
      if (userMember) {
        setUserRole(userMember.role);
      }

      if (sessionUserId) {
        const friendsRes = await fetch("/api/friends");
        if (friendsRes.ok) {
          const friendsData = await friendsRes.json();
          setFriends(Array.isArray(friendsData) ? friendsData : []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleInviteFriend() {
    if (!selectedFriendId) {
      setError("Select a friend to add.");
      return;
    }

    try {
      setInviting(true);
      const res = await fetch(`/api/campaigns/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          userId: selectedFriendId,
          role: "PLAYER",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || errorData.error || "Failed to add friend");
      }

      setSelectedFriendId("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add friend");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: "GM" | "MODERATOR" | "PLAYER") {
    try {
      setSaving(true);
      const res = await fetch(`/api/campaigns/${campaignId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update role");
      }

      setMembers(
        members.map((m) =>
          m.id === memberId
            ? { ...m, role: newRole }
            : m
        ).sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role])
      );
      setEditingMemberId(null);
      setEditingRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/campaigns/${campaignId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to remove member");
      }

      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded bg-zinc-200 dark:bg-zinc-800"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-zinc-600 dark:text-zinc-400">
            {error || "Campaign not found"}
          </p>
        </div>
      </div>
    );
  }

  const isGM = userRole === "GM";
  const memberIds = new Set(members.map((member) => member.userId));
  const friendOptions = friends
    .filter((friend) => friend.friendId && !memberIds.has(friend.friendId))
    .map((friend) => ({
      id: friend.friendId as string,
      name: friend.friendName || friend.friendId,
    }));

  return (
    <div className="min-h-[calc(100vh-73px)] bg-zinc-50 dark:bg-black px-6 py-10">
      <main className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link
              href={`/campaigns/${campaignId}`}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 mb-2 inline-block"
            >
              ← Back to campaign
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {campaign.name} - Members
            </h1>
            {campaign.createdByName && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                GM: {campaign.createdByName}
              </p>
            )}
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Manage campaign membership and roles
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {!isGM && (
          <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-200">
            You can view campaign members but cannot make changes unless you are the Game Master.
          </div>
        )}

        {isGM && (
          <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Add Friend as Player
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={selectedFriendId}
                onChange={(e) => setSelectedFriendId(e.target.value)}
                className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Select friend</option>
                {friendOptions.map((friend) => (
                  <option key={friend.id} value={friend.id}>
                    {friend.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleInviteFriend}
                disabled={inviting || !selectedFriendId}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
              >
                {inviting ? "Adding..." : "Add Player"}
              </button>
            </div>
            {friendOptions.length === 0 && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                All friends are already in this campaign.
              </p>
            )}
          </div>
        )}

        {/* Members List */}
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
          <div className="grid grid-cols-3 gap-4 border-b border-zinc-200 bg-zinc-50 px-6 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <div>Player</div>
            <div>Role</div>
            <div className="text-right">Actions</div>
          </div>

          {members.length === 0 ? (
            <div className="px-6 py-8 text-center text-zinc-600 dark:text-zinc-400">
              <p>No members yet</p>
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-3 gap-4 border-b border-zinc-200 px-6 py-4 items-center dark:border-zinc-800 last:border-0"
              >
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  <span>{member.user.name}</span>
                  {member.role === "GM" && (
                    <span className="ml-2 inline-block rounded bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      GM
                    </span>
                  )}
                </div>
                <div>
                  {editingMemberId === member.id && isGM ? (
                    <select
                      value={editingRole || member.role}
                      onChange={(e) => setEditingRole(e.target.value as any)}
                      className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="PLAYER">Player</option>
                      <option value="MODERATOR">Moderator</option>
                      <option value="GM">Game Master</option>
                    </select>
                  ) : (
                    <span className="inline-block rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {ROLE_LABELS[member.role]}
                    </span>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  {isGM && member.role !== "GM" && (
                    <>
                      {editingMemberId === member.id ? (
                        <>
                          <button
                            onClick={() =>
                              handleRoleChange(member.id, editingRole || member.role)
                            }
                            disabled={saving}
                            className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingMemberId(null);
                              setEditingRole(null);
                            }}
                            className="text-xs px-2 py-1 rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingMemberId(member.id);
                              setEditingRole(member.role);
                            }}
                            className="text-xs px-2 py-1 rounded bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                          >
                            Edit Role
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={saving}
                            className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
