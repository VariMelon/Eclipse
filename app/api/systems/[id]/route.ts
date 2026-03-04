import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/apiAuth";
import { validateUserInput } from "@/lib/inputValidation";
import { mergeSystemResources } from "@/lib/systemResourceMerge";

function sanitizeTags(rawTags: unknown): string[] {
  if (!Array.isArray(rawTags)) {
    return [];
  }

  return rawTags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, list) => list.findIndex((candidate) => candidate.toLowerCase() === tag.toLowerCase()) === index)
    .slice(0, 20);
}

// GET - Fetch a single system by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession();
    const { id } = await params;

    const system = await prisma.system.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            name: true,
            id: true,
          },
        },
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    if (!system) {
      return NextResponse.json(
        { message: "System not found" },
        { status: 404 }
      );
    }

    // Check if user has access (creator or public system)
    if (system.createdBy !== user.id && !system.isPublic) {
      return NextResponse.json(
        { message: "You don't have access to this system" },
        { status: 403 }
      );
    }

    const mergedResources = mergeSystemResources(system as unknown as Record<string, unknown>);
    return NextResponse.json({ system, mergedResources }, { status: 200 });
  } catch (error) {
    console.error("Error fetching system:", error);
    return NextResponse.json(
      { message: "Failed to fetch system" },
      { status: 500 }
    );
  }
}

// PATCH - Update a system
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession();
    const { id } = await params;
    const body = await request.json();

    // Check if system exists and user is the creator
    const existingSystem = await prisma.system.findUnique({
      where: { id },
    });

    if (!existingSystem) {
      return NextResponse.json(
        { message: "System not found" },
        { status: 404 }
      );
    }

    if (existingSystem.createdBy !== user.id) {
      return NextResponse.json(
        { message: "Only the system creator can edit this system" },
        { status: 403 }
      );
    }

    // Validate name if provided
    if (body.name) {
      const nameValidation = validateUserInput(body.name);
      if (!nameValidation.ok) {
        return NextResponse.json(
          { message: nameValidation.error },
          { status: 400 }
        );
      }
    }

    // Validate description if provided
    if (body.description) {
      const descValidation = validateUserInput(body.description);
      if (!descValidation.ok) {
        return NextResponse.json(
          { message: descValidation.error },
          { status: 400 }
        );
      }
    }

    if (body.tags !== undefined) {
      const tags = sanitizeTags(body.tags);
      for (const tag of tags) {
        const tagValidation = validateUserInput(tag);
        if (!tagValidation.ok) {
          return NextResponse.json(
            { message: tagValidation.error },
            { status: 400 }
          );
        }
      }
    }

    // Update system
    const updatedSystem = await prisma.system.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.description !== undefined && {
          description: body.description?.trim() || null,
        }),
        ...(body.tags !== undefined && { tags: sanitizeTags(body.tags) }),
        ...(body.diceSystem !== undefined && { diceSystem: body.diceSystem }),
        ...(body.characterCreationRules !== undefined && {
          characterCreationRules: body.characterCreationRules,
        }),
        ...(body.npcCreationRules !== undefined && {
          npcCreationRules: body.npcCreationRules,
        }),
        ...(body.monsterCreationRules !== undefined && {
          monsterCreationRules: body.monsterCreationRules,
        }),
        ...(body.environmentCreationRules !== undefined && {
          environmentCreationRules: body.environmentCreationRules,
        }),
        ...(body.races !== undefined && { races: body.races }),
        ...(body.classes !== undefined && { classes: body.classes }),
        ...(body.skills !== undefined && { skills: body.skills }),
        ...(body.backgrounds !== undefined && { backgrounds: body.backgrounds }),
        ...(body.currencies !== undefined && { currencies: body.currencies }),
        ...(body.features !== undefined && { features: body.features }),
        ...(body.featuresClass !== undefined && { featuresClass: body.featuresClass }),
        ...(body.featuresRace !== undefined && { featuresRace: body.featuresRace }),
        ...(body.tools !== undefined && { tools: body.tools }),
        ...(body.magicApplications !== undefined && { magicApplications: body.magicApplications }),
        ...(body.spells !== undefined && { spells: body.spells }),
        ...(body.weapons !== undefined && { weapons: body.weapons }),
        ...(body.armor !== undefined && { armor: body.armor }),
        ...(body.items !== undefined && { items: body.items }),
        ...(body.crossSystemDefinitions !== undefined && { crossSystemDefinitions: body.crossSystemDefinitions }),
        ...(body.statBlocks !== undefined && { statBlocks: body.statBlocks }),
        ...(body.levelUpCriteria !== undefined && {
          levelUpCriteria: body.levelUpCriteria,
        }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      },
      include: {
        creator: {
          select: {
            name: true,
            id: true,
          },
        },
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    return NextResponse.json({ system: updatedSystem }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating system:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "A system with this name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update system" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a system
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession();
    const { id } = await params;

    // Check if system exists and user is the creator
    const system = await prisma.system.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    if (!system) {
      return NextResponse.json(
        { message: "System not found" },
        { status: 404 }
      );
    }

    if (system.createdBy !== user.id) {
      return NextResponse.json(
        { message: "Only the system creator can delete this system" },
        { status: 403 }
      );
    }

    // Check if system is being used by campaigns
    if (system._count.campaigns > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete system that is used by ${system._count.campaigns} campaign(s)`,
        },
        { status: 409 }
      );
    }

    // Delete system
    await prisma.system.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "System deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting system:", error);
    return NextResponse.json(
      { message: "Failed to delete system" },
      { status: 500 }
    );
  }
}
