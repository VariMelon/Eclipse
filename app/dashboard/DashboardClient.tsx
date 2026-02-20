"use client";

import { useEffect, useMemo, useState } from "react";

type Campaign = { id: string; name: string; createdBy: string; createdByName?: string };
type Character = { id: string; name: string; userId: string; level: number; campaignId?: string | null };

export default function DashboardClient({ username, userId }: { username: string; userId: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [error, setError] = useState("");

  async function loadAll() {
    setError("");
    try {
      const [campaignRes, characterRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/characters"),
      ]);

      const [campaignData, characterData] = await Promise.all([
        campaignRes.json(),
        characterRes.json(),
      ]);

      setCampaigns(Array.isArray(campaignData.campaigns) ? campaignData.campaigns : []);
      setCharacters(Array.isArray(characterData.characters) ? characterData.characters : []);
    } catch {
      setError("Failed to load account data.");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

  const campaignsById = useMemo(() => {
    return new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  }, [campaigns]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "2rem" }}>
      <h1>My Info</h1>
      <p style={{ marginBottom: 16 }}>Account overview, characters, and campaigns.</p>
      <p style={{ marginBottom: 16 }}>Signed in as: {username}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <section style={{ marginBottom: 24 }}>
        <h2>Your Account</h2>
        <ul>
          <li>User ID: {userId}</li>
          <li>Username: {username}</li>
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Your Characters</h2>
        <ul>
          {characters.map((character) => (
            <li key={character.id}>
              {character.name} (Level {character.level})
            </li>
          ))}
          {characters.length === 0 ? <li>No characters yet.</li> : null}
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Campaigns Your Characters Are In</h2>
        <ul>
          {characters.map((character) => {
            if (!character.campaignId) return null;
            const campaign = campaignsById.get(character.campaignId);
            return (
              <li key={`${character.id}-${character.campaignId}`}>
                {character.name} → {campaign?.name || character.campaignId}
              </li>
            );
          })}
          {characters.every((character) => !character.campaignId) ? (
            <li>No campaign-linked characters yet.</li>
          ) : null}
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Your Campaigns</h2>
        <ul>
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              {campaign.name} {campaign.createdByName ? `- GM: ${campaign.createdByName}` : ''}
            </li>
          ))}
          {campaigns.length === 0 ? <li>No campaigns yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
