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

    // Get campaign to check ownership and membership
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        subtitle: true,
        system: true,
        createdByName: true,
        createdBy: true,
        createdAt: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { message: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check if user is creator or member
    const member = await prisma.campaignMember.findFirst({
      where: {
        campaignId,
        userId: user.id,
      },
      select: { role: true },
    });

    const isCreator = campaign.createdBy === user.id;
    const isGM = isCreator || member?.role === "GM";

    if (!member && !isCreator) {
      return NextResponse.json(
        { message: "You are not a member of this campaign" },
        { status: 403 }
      );
    }

    return NextResponse.json({ ...campaign, isGM }, { status: 200 });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { message: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const user = await validateSession();
    const campaignId = params.id;

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

    // Check if user is GM
    const isGM = isCreator || await hasCampaignRole(user.id, campaignId, ["GM"]);
    if (!isGM) {
      return NextResponse.json(
        { message: "Only Game Masters can delete campaigns" },
        { status: 403 }
      );
    }

    // Delete campaign (cascading deletes handled by Prisma)
    await prisma.campaign.delete({
      where: { id: campaignId },
    });

    return NextResponse.json(
      { message: "Campaign deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { message: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
