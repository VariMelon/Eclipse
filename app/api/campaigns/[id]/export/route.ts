import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/apiAuth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const user = await validateSession();
    const campaignId = params.id;

    // Get campaign to check ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        system: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { message: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check if user is creator or GM
    const member = await prisma.campaignMember.findFirst({
      where: {
        campaignId,
        userId: user.id,
      },
      select: { role: true },
    });

    const isCreator = campaign.createdBy === user.id;
    const isGM = isCreator || member?.role === "GM";

    if (!isGM) {
      return NextResponse.json(
        { message: "Only Game Masters can export campaign data" },
        { status: 403 }
      );
    }

    // Fetch all campaign data
    const [members, characters, notes] = await Promise.all([
      prisma.campaignMember.findMany({
        where: { campaignId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { user: { name: "asc" } },
      }),
      prisma.character.findMany({
        where: { campaignId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          levelSheets: {
            orderBy: { level: "asc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.note.findMany({
        where: { campaignId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Format export data
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      exportedBy: user.name || user.email,
      campaign: {
        name: campaign.name,
        subtitle: campaign.subtitle,
        systemId: campaign.systemId,
        systemName: campaign.system?.name || null,
        createdAt: campaign.createdAt.toISOString(),
      },
      members: members.map((m) => ({
        username: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
      characters: characters.map((c) => ({
        name: c.name,
        level: c.level,
        stats: c.stats,
        ownerUsername: c.user.name,
        createdAt: c.createdAt.toISOString(),
        levelSheets: c.levelSheets.map((ls) => ({
          level: ls.level,
          stats: ls.stats,
          createdAt: ls.createdAt.toISOString(),
        })),
      })),
      notes: notes.map((n) => ({
        content: n.content,
        aliases: n.aliases,
        authorUsername: n.user?.name || null,
        createdAt: n.createdAt.toISOString(),
      })),
    };

    // Return as downloadable JSON
    const fileName = `${campaign.name.replace(/[^a-z0-9]/gi, "_")}_export_${new Date().toISOString().split("T")[0]}.json`;
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting campaign:", error);
    return NextResponse.json(
      { message: "Failed to export campaign" },
      { status: 500 }
    );
  }
}
