import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/apiAuth";
import { validateUserInput } from "@/lib/inputValidation";

function sanitizeTags(rawTags: unknown): string[] {
  if (!Array.isArray(rawTags)) {
    return [];
  }

  const tags = rawTags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, list) => list.findIndex((candidate) => candidate.toLowerCase() === tag.toLowerCase()) === index)
    .slice(0, 20);

  return tags;
}

// GET - Fetch all systems (user's own + public systems)
export async function GET(request: NextRequest) {
  try {
    const user = await validateSession();
    const search = request.nextUrl.searchParams.get("search")?.trim() || "";

    const whereClause = {
      OR: [
        { createdBy: user.id },
        { isPublic: true },
      ],
      ...(search
        ? {
            AND: [
              {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { description: { contains: search, mode: "insensitive" as const } },
                  { tags: { array_contains: [search] } },
                ],
              },
            ],
          }
        : {}),
    };

    const systems = await prisma.system.findMany({
      where: whereClause,
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
        favorites: {
          where: { userId: user.id },
          select: { id: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const systemsWithFavorite = systems.map((system) => {
      const { favorites, ...rest } = system;
      return {
        ...rest,
        isFavorited: favorites.length > 0,
      };
    });

    return NextResponse.json({ systems: systemsWithFavorite }, { status: 200 });
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

    // Create system
    const system = await prisma.system.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        ...(tags.length > 0 && { tags }),
        diceSystem: body.diceSystem || null,
        characterCreationRules: body.characterCreationRules || null,
        npcCreationRules: body.npcCreationRules || null,
        monsterCreationRules: body.monsterCreationRules || null,
        environmentCreationRules: body.environmentCreationRules || null,
        races: body.races || null,
        classes: body.classes || null,
        ...(body.skills !== undefined && { skills: body.skills }),
        ...(body.backgrounds !== undefined && { backgrounds: body.backgrounds }),
        ...(body.currencies !== undefined && { currencies: body.currencies }),
        ...(body.features !== undefined && { features: body.features }),
        ...(body.featuresClass !== undefined && { featuresClass: body.featuresClass }),
        ...(body.featuresRace !== undefined && { featuresRace: body.featuresRace }),
        ...(body.tools !== undefined && { tools: body.tools }),
        ...(body.magicApplications !== undefined && { magicApplications: body.magicApplications }),
        spells: body.spells || null,
        weapons: body.weapons || null,
        armor: body.armor || null,
        items: body.items || null,
        ...(body.crossSystemDefinitions !== undefined && { crossSystemDefinitions: body.crossSystemDefinitions }),
        statBlocks: body.statBlocks || null,
        levelUpCriteria: body.levelUpCriteria || null,
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
