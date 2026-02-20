import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession, hasCampaignRole } from "@/lib/apiAuth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const user = await validateSession();
    const campaignId = params.id;

    // Get campaign first to check if user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { createdBy: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { message: "Campaign not found" },
        { status: 404 }
      );
    }

    const isCreator = campaign.createdBy === user.id;

    // Check if user is member
    const member = await prisma.campaignMember.findFirst({
      where: {
        campaignId,
        userId: user.id,
      },
    });

    if (!member && !isCreator) {
      return NextResponse.json(
        { message: "You are not a member of this campaign" },
        { status: 403 }
      );
    }

    // Get all members of the campaign
    const members = await prisma.campaignMember.findMany({
      where: { campaignId },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { role: "asc" }, // GM first, then MODERATOR, then PLAYER
        { user: { name: "asc" } },
      ],
    });

    return NextResponse.json({ members }, { status: 200 });
  } catch (error) {
    console.error("Error fetching campaign members:", error);
    return NextResponse.json(
      { message: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
