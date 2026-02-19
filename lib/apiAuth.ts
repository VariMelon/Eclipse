import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const CAMPAIGN_ROLE = {
  GM: "GM",
  MODERATOR: "MODERATOR",
  PLAYER: "PLAYER",
} as const;

export type CampaignRole = (typeof CAMPAIGN_ROLE)[keyof typeof CAMPAIGN_ROLE];

const CAMPAIGN_ACCESS_OR = (userId: string) => ({
  OR: [
    { createdBy: userId },
    { members: { some: { userId } } },
  ],
});

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function badRequestResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function getSessionUserId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  return userId ?? null;
}

export function getCampaignAccessWhere(userId: string) {
  return CAMPAIGN_ACCESS_OR(userId);
}

export async function canAccessCampaign(userId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      ...CAMPAIGN_ACCESS_OR(userId),
    },
    select: { id: true },
  });

  return Boolean(campaign);
}

export async function getCampaignRole(userId: string, campaignId: string): Promise<CampaignRole | null> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { createdBy: true },
  });

  if (!campaign) return null;
  if (campaign.createdBy === userId) return CAMPAIGN_ROLE.GM;

  const membership = await prisma.campaignMember.findFirst({
    where: { campaignId, userId },
    select: { role: true },
  });

  return membership?.role ?? null;
}

export async function hasCampaignRole(userId: string, campaignId: string, roles: CampaignRole[]) {
  const role = await getCampaignRole(userId, campaignId);
  if (!role) return false;
  return roles.includes(role);
}
