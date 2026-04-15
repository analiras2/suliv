import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@suliv/db";
import { AuthError, requireAuth } from "../../../lib/auth-middleware";
import {
  buildPaginatedResponse,
  parsePaginationParams,
  toPrismaSkipTake,
} from "../../../lib/pagination";

export async function GET(req: NextRequest) {
  let userId: string;
  try {
    ({ userId } = await requireAuth(req));
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }

  const { searchParams } = req.nextUrl;
  const pagination = parsePaginationParams({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
  const { skip, take } = toPrismaSkipTake(pagination);

  const [favorites, total] = await Promise.all([
    prisma.userFavorite.findMany({
      where: { userId },
      orderBy: { savedAt: "desc" },
      skip,
      take,
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            slug: true,
            imageUrl: true,
            prepTimeMin: true,
            cookTimeMin: true,
            difficulty: true,
            category: true,
            tags: true,
            servings: true,
          },
        },
      },
    }),
    prisma.userFavorite.count({ where: { userId } }),
  ]);

  const data = favorites.map(({ recipe }) => ({
    ...recipe,
    isFavorite: true,
  }));

  return NextResponse.json(buildPaginatedResponse(data, total, pagination));
}
