import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@suliv/db";
import { AuthError, requireAuth } from "../../../../lib/auth-middleware";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try {
    ({ userId } = await requireAuth(req));
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }

  const { id: recipeId } = await params;

  const existing = await prisma.userFavorite.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  });

  if (existing) {
    return NextResponse.json({ savedAt: existing.savedAt }, { status: 200 });
  }

  const favorite = await prisma.userFavorite.create({
    data: { userId, recipeId },
  });

  return NextResponse.json({ savedAt: favorite.savedAt }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try {
    ({ userId } = await requireAuth(req));
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }

  const { id: recipeId } = await params;

  await prisma.userFavorite.deleteMany({
    where: { userId, recipeId },
  });

  return new NextResponse(null, { status: 204 });
}
