import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/apiAuth";
import { validateUserInput } from "@/lib/inputValidation";

// GET - Fetch all systems (user's own + public systems)
export async function GET(request: NextRequest) {
  try {
    const user = await validateSession();

    const systems = await prisma.system.findMany({
      where: {
        OR: [
          { createdBy: user.id }, // User's own systems
          { isPublic: true }, // Public systems anyone can use
        ],
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ systems }, { status: 200 });
  } catch (error) {
    console.error("Error fetching systems:", error);
    return NextResponse.json(
      { message: "Failed to fetch systems" },
      { status: 500 }
    );
  }
}

// POST - Create a new system
export async function POST(request: NextRequest) {
  try {
    const user = await validateSession();
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { message: "System name is required" },
        { status: 400 }
      );
    }

    // Validate name
    const nameValidation = validateUserInput(body.name);
    if (!nameValidation.ok) {
      return NextResponse.json(
        { message: nameValidation.error },
        { status: 400 }
      );
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

    // Create system
    const system = await prisma.system.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        diceSystem: body.diceSystem || null,
        characterCreationRules: body.characterCreationRules || null,
        npcCreationRules: body.npcCreationRules || null,
        monsterCreationRules: body.monsterCreationRules || null,
        environmentCreationRules: body.environmentCreationRules || null,
        races: body.races || null,
        classes: body.classes || null,
        spells: body.spells || null,
        weapons: body.weapons || null,
        armor: body.armor || null,
        items: body.items || null,
        statBlocks: body.statBlocks || null,
        levelUpCriteria: body.levelUpCriteria || null,
        levelUpEffects: body.levelUpEffects || null,
        isPublic: body.isPublic === true,
        createdBy: user.id,
      },
      include: {
        creator: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });

    return NextResponse.json({ system }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating system:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "A system with this name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create system" },
      { status: 500 }
    );
  }
}
