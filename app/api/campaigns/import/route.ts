import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/apiAuth";
import { validateUserInput } from "@/lib/inputValidation";

interface ImportData {
  version: string;
  campaign: {
    name: string;
    subtitle?: string;
    systemId?: string;
    systemName?: string;
  };
  members?: Array<{
    username: string;
    email: string;
    role: "GM" | "MODERATOR" | "PLAYER";
  }>;
  characters?: Array<{
    name: string;
    level: number;
    stats: any;
    ownerUsername: string;
    levelSheets?: Array<{
      level: number;
      stats: any;
    }>;
  }>;
  notes?: Array<{
    content: string;
    aliases: string[];
    authorUsername?: string | null;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const user = await validateSession();
    const data: ImportData = await req.json();

    // Validate basic structure
    const validation = validateUserInput(data);
    if (!validation.ok) {
      return NextResponse.json(
        { message: validation.error || "Invalid input" },
        { status: 400 }
      );
    }

    if (!data.version || !data.campaign || !data.campaign.name) {
      return NextResponse.json(
        { message: "Invalid import data format. Missing required fields." },
        { status: 400 }
      );
    }

    // Check version compatibility
    if (data.version !== "1.0") {
      return NextResponse.json(
        { message: `Unsupported import version: ${data.version}` },
        { status: 400 }
      );
    }

    // Try to match system if provided
    let systemId: string | null = null;
    if (data.campaign.systemId) {
      // First try by systemId
      const system = await prisma.system.findUnique({
        where: { id: data.campaign.systemId },
      });
      // Check if user has access to this system
      if (system && (system.isPublic || system.createdBy === user.id)) {
        systemId = system.id;
      }
    } else if (data.campaign.systemName) {
      // Try to match by name
      const system = await prisma.system.findFirst({
        where: {
          name: data.campaign.systemName,
          OR: [
            { isPublic: true },
            { createdBy: user.id },
          ],
        },
      });
      if (system) {
        systemId = system.id;
      }
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: data.campaign.name,
        subtitle: data.campaign.subtitle || null,
        systemId: systemId,
        createdBy: user.id,
        createdByName: user.name || user.email || "Unknown",
      },
    });

    // Import members (if provided)
    if (data.members && data.members.length > 0) {
      for (const memberData of data.members) {
        try {
          // Find user by username or email
          const targetUser = await prisma.user.findFirst({
            where: {
              OR: [
                { name: memberData.username },
                { email: memberData.email },
              ],
            },
            select: { id: true },
          });

          if (targetUser) {
            // Add as campaign member
            await prisma.campaignMember.create({
              data: {
                campaignId: campaign.id,
                userId: targetUser.id,
                role: memberData.role || "PLAYER",
              },
            });
          }
        } catch (error) {
          console.warn(`Failed to import member ${memberData.username}:`, error);
          // Continue with other members
        }
      }
    }

    // Import characters (if provided)
    const userCharacterMap = new Map<string, string>();
    if (data.characters && data.characters.length > 0) {
      for (const charData of data.characters) {
        try {
          // Find user by username - if not found, assign to current user
          let ownerId = user.id;
          const targetUser = await prisma.user.findFirst({
            where: { name: charData.ownerUsername },
            select: { id: true },
          });
          if (targetUser) {
            ownerId = targetUser.id;
          }

          // Create character
          const character = await prisma.character.create({
            data: {
              name: charData.name,
              level: charData.level,
              stats: charData.stats,
              userId: ownerId,
              campaignId: campaign.id,
            },
          });

          // Import level sheets
          if (charData.levelSheets && charData.levelSheets.length > 0) {
            for (const sheetData of charData.levelSheets) {
              await prisma.levelSheet.create({
                data: {
                  characterId: character.id,
                  level: sheetData.level,
                  stats: sheetData.stats,
                },
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to import character ${charData.name}:`, error);
          // Continue with other characters
        }
      }
    }

    // Import notes (if provided)
    if (data.notes && data.notes.length > 0) {
      for (const noteData of data.notes) {
        try {
          // Find author by username - if not found, assign to current user
          let authorId: string | undefined = user.id;
          if (noteData.authorUsername) {
            const targetUser = await prisma.user.findFirst({
              where: { name: noteData.authorUsername },
              select: { id: true },
            });
            if (targetUser) {
              authorId = targetUser.id;
            }
          }

          await prisma.note.create({
            data: {
              content: noteData.content,
              aliases: noteData.aliases || [],
              campaignId: campaign.id,
              userId: authorId,
            },
          });
        } catch (error) {
          console.warn(`Failed to import note:`, error);
          // Continue with other notes
        }
      }
    }

    return NextResponse.json(
      {
        message: "Campaign imported successfully",
        campaignId: campaign.id,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          subtitle: campaign.subtitle,
          systemId: campaign.systemId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error importing campaign:", error);
    return NextResponse.json(
      { message: "Failed to import campaign" },
      { status: 500 }
    );
  }
}
