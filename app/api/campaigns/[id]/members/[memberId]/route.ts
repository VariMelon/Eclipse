import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession, hasCampaignRole } from "@/lib/apiAuth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const params = await context.params;
    const user = await validateSession();
    const campaignId = params.id;
    const memberId = params.memberId;

    // Check if user is GM
    const isGM = await hasCampaignRole(user.id, campaignId, ["GM"]);
    if (!isGM) {
      return NextResponse.json(
        { message: "Only Game Masters can modify member roles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["PLAYER", "MODERATOR", "GM"].includes(role)) {
      return NextResponse.json(
        { message: "Invalid role" },
        { status: 400 }
      );
    }

    // Prevent removing the last GM
    if (role !== "GM") {
      const gmCount = await prisma.campaignMember.count({
        where: {
          campaignId,
          role: "GM",
        },
      });

      const targetMember = await prisma.campaignMember.findUnique({
        where: { id: memberId },
      });

      if (targetMember?.role === "GM" && gmCount === 1) {
        return NextResponse.json(
          { message: "Cannot remove the last Game Master from a campaign" },
          { status: 400 }
        );
      }
    }

    // Update the member role
    const updatedMember = await prisma.campaignMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(updatedMember, { status: 200 });
  } catch (error) {
    console.error("Error updating campaign member:", error);
    return NextResponse.json(
      { message: "Failed to update member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const params = await context.params;
    const user = await validateSession();
    const campaignId = params.id;
    const memberId = params.memberId;

    // Check if user is GM
    const isGM = await hasCampaignRole(user.id, campaignId, ["GM"]);
    if (!isGM) {
      return NextResponse.json(
        { message: "Only Game Masters can remove members" },
        { status: 403 }
      );
    }

    // Prevent removing the last GM
    const targetMember = await prisma.campaignMember.findUnique({
      where: { id: memberId },
    });

    if (targetMember?.role === "GM") {
      const gmCount = await prisma.campaignMember.count({
        where: {
          campaignId,
          role: "GM",
        },
      });

      if (gmCount === 1) {
        return NextResponse.json(
          { message: "Cannot remove the last Game Master from a campaign" },
          { status: 400 }
        );
      }
    }

    // Prevent users from removing themselves unless there's another GM
    if (targetMember?.userId === user.id) {
      const gmCount = await prisma.campaignMember.count({
        where: {
          campaignId,
          role: "GM",
        },
      });

      if (gmCount === 1 && targetMember.role === "GM") {
        return NextResponse.json(
          { message: "Cannot remove the last Game Master from a campaign" },
          { status: 400 }
        );
      }
    }

    // Delete the member
    await prisma.campaignMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: "Member removed" }, { status: 200 });
  } catch (error) {
    console.error("Error removing campaign member:", error);
    return NextResponse.json(
      { message: "Failed to remove member" },
      { status: 500 }
    );
  }
}
