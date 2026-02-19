"use client";

import { FormEvent, useEffect, useState } from "react";

type Campaign = { id: string; name: string; createdBy: string };
type Character = { id: string; name: string; userId: string; level: number };
type Note = { id: string; content: string; aliases: string[] };
type Friend = {
  id: string;
  requesterId: string;
  receiverId: string;
  requesterName?: string | null;
  receiverName?: string | null;
  status: string;
};

export default function DashboardClient({ username, userId }: { username: string; userId: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error, setError] = useState("");

  const [campaignName, setCampaignName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [characterLevel, setCharacterLevel] = useState(1);
  const [noteContent, setNoteContent] = useState("");
  const [noteAliases, setNoteAliases] = useState("");
  const [friendReceiverName, setFriendReceiverName] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  async function loadAll() {
    setError("");
    try {
      const [campaignRes, characterRes, noteRes, friendRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/characters"),
        fetch("/api/notes"),
        fetch("/api/friends"),
      ]);

      const [campaignData, characterData, noteData, friendData] = await Promise.all([
        campaignRes.json(),
        characterRes.json(),
        noteRes.json(),
        friendRes.json(),
      ]);

      setCampaigns(Array.isArray(campaignData) ? campaignData : []);
      setCharacters(Array.isArray(characterData) ? characterData : []);
      setNotes(Array.isArray(noteData) ? noteData : []);
      setFriends(Array.isArray(friendData) ? friendData : []);
    } catch {
      setError("Failed to load dashboard data.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

  async function createCampaign(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: campaignName }),
    });
    if (!res.ok) {
      setError("Failed to create campaign.");
      return;
    }
    setCampaignName("");
    await loadAll();
  }

  async function createCharacter(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: characterName,
        level: characterLevel,
        stats: {},
      }),
    });
    if (!res.ok) {
      setError("Failed to create character.");
      return;
    }
    setCharacterName("");
    await loadAll();
  }

  async function createNote(e: FormEvent) {
    e.preventDefault();
    setError("");
    const aliases = noteAliases
      .split(",")
      .map((alias) => alias.trim())
      .filter(Boolean);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteContent, aliases }),
    });
    if (!res.ok) {
      setError("Failed to create note.");
      return;
    }
    setNoteContent("");
    setNoteAliases("");
    await loadAll();
  }

  async function createFriend(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: friendReceiverName,
      }),
    });
    if (!res.ok) {
      setError("Failed to create friend request.");
      return;
    }
    setFriendReceiverName("");
    await loadAll();
  }

  function getFriendTarget(friend: Friend) {
    const isRequester = friend.requesterId === userId;
    return {
      id: isRequester ? friend.receiverId : friend.requesterId,
      name: isRequester ? friend.receiverName : friend.requesterName,
    };
  }

  async function addFriendToCampaign(friend: Friend) {
    if (!selectedCampaignId) {
      setError("Select a campaign first.");
      return;
    }
    setError("");
    const target = getFriendTarget(friend);
    const res = await fetch("/api/campaigns/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: selectedCampaignId,
        userId: target.id,
        role: "PLAYER",
      }),
    });
    if (!res.ok) {
      setError("Failed to add friend to campaign.");
      return;
    }
    await loadAll();
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "2rem" }}>
      <h1>Dashboard</h1>
      <p style={{ marginBottom: 16 }}>Campaigns, characters, notes, and friends modules.</p>
      <p style={{ marginBottom: 16 }}>Signed in as: {username}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <section style={{ marginBottom: 24 }}>
        <h2>Campaigns</h2>
        <form onSubmit={createCampaign} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Campaign name" required />
          <button type="submit">Create</button>
        </form>
        <ul>
          {campaigns.map((campaign) => (
            <li key={campaign.id}>{campaign.name}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Characters</h2>
        <form onSubmit={createCharacter} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={characterName} onChange={(e) => setCharacterName(e.target.value)} placeholder="Character name" required />
          <input
            type="number"
            min={1}
            value={characterLevel}
            onChange={(e) => setCharacterLevel(Number(e.target.value))}
            placeholder="Level"
            required
          />
          <button type="submit">Create</button>
        </form>
        <ul>
          {characters.map((character) => (
            <li key={character.id}>
              {character.name} (Level {character.level})
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Notes</h2>
        <form onSubmit={createNote} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Note content" required />
          <input
            value={noteAliases}
            onChange={(e) => setNoteAliases(e.target.value)}
            placeholder="Aliases comma-separated"
          />
          <button type="submit">Create</button>
        </form>
        <ul>
          {notes.map((note) => (
            <li key={note.id}>
              {note.content}
              {note.aliases.length > 0 ? ` [${note.aliases.join(", ")}]` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Friends</h2>
        <form onSubmit={createFriend} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={friendReceiverName}
            onChange={(e) => setFriendReceiverName(e.target.value)}
            placeholder="Friend username"
            required
          />
          <button type="submit">Create</button>
        </form>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            style={{ minWidth: 220 }}
          >
            <option value="">Select campaign</option>
            {campaigns
              .filter((campaign) => campaign.createdBy === userId)
              .map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
          </select>
          <span style={{ fontSize: 12, color: "#666" }}>
            Invite friends to campaigns you created.
          </span>
        </div>
        <ul>
          {friends.map((friend) => (
            <li key={friend.id}>
              {getFriendTarget(friend).name || getFriendTarget(friend).id}
              <button
                type="button"
                onClick={() => addFriendToCampaign(friend)}
                style={{ marginLeft: 8 }}
              >
                Add to campaign
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
