import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateSession } from "@/lib/apiAuth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession();
    const { id } = await params;
    const body = await request.json();

    if (typeof body.favorite !== "boolean") {
      return NextResponse.json(
        { message: "favorite must be a boolean" },
        { status: 400 }
      );
    }

    const system = await prisma.system.findUnique({
      where: { id },
      select: {
        id: true,
        createdBy: true,
        isPublic: true,
      },
    });

    if (!system) {
      return NextResponse.json(
        { message: "System not found" },
        { status: 404 }
      );
    }

    if (system.createdBy !== user.id && !system.isPublic) {
      return NextResponse.json(
        { message: "You don't have access to this system" },
        { status: 403 }
      );
    }

    if (body.favorite) {
      await prisma.systemFavorite.upsert({
        where: {
          userId_systemId: {
            userId: user.id,
            systemId: id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          systemId: id,
        },
      });
    } else {
      await prisma.systemFavorite.deleteMany({
        where: {
          userId: user.id,
          systemId: id,
        },
      });
    }

    return NextResponse.json({ isFavorited: body.favorite }, { status: 200 });
  } catch (error) {
    console.error("Error updating system favorite:", error);
    return NextResponse.json(
      { message: "Failed to update favorite" },
      { status: 500 }
    );
  }
}
