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
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category") ?? null;
  const difficulty = searchParams.get("difficulty") ?? null;
  const maxTime = searchParams.get("maxTime") ? Number(searchParams.get("maxTime")) : null;
  const mainIngredient = searchParams.get("mainIngredient")?.trim() ?? null;

  const pagination = parsePaginationParams({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
  const { skip, take } = toPrismaSkipTake(pagination);

  // Fetch user allergens for exclusion
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { allergens: true },
  });
  const allergens: string[] = profile?.allergens ?? [];

  // Build WHERE conditions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (category) where.category = category;
  if (difficulty) where.difficulty = difficulty;
  if (maxTime) {
    where.prepTimeMin = undefined;
    // Filter by total time — we'll handle this with a raw query workaround
  }

  // Recipes whose ingredients belong to one of the user's allergen groups
  const allergenRecipeIds =
    allergens.length > 0
      ? (
          await prisma.recipeIngredient.findMany({
            where: {
              ingredient: { allergenGroup: { in: allergens } },
            },
            select: { recipeId: true },
          })
        ).map((r) => r.recipeId)
      : [];

  if (allergenRecipeIds.length > 0) {
    where.id = { notIn: allergenRecipeIds };
  }

  if (mainIngredient) {
    where.ingredients = {
      some: {
        ingredient: {
          name: { contains: mainIngredient, mode: "insensitive" },
        },
      },
    };
  }

  // Accent-insensitive search via raw SQL, then filter with Prisma
  let searchIds: string[] | null = null;
  if (q) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM recipes
      WHERE unaccent(lower(title)) ILIKE unaccent(lower(${`%${q}%`}))
    `;
    searchIds = rows.map((r) => r.id);
    where.id = { ...(where.id ?? {}), in: searchIds };
  }

  // maxTime filter: prepTimeMin + cookTimeMin <= maxTime
  if (maxTime) {
    const timeRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM recipes
      WHERE prep_time_min + cook_time_min <= ${maxTime}
    `;
    const timeIds = timeRows.map((r) => r.id);
    if (where.id?.in) {
      where.id.in = where.id.in.filter((id: string) => timeIds.includes(id));
    } else {
      where.id = { ...(where.id ?? {}), in: timeIds };
    }
  }

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
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
        favorites: {
          where: { userId },
          select: { id: true },
        },
      },
    }),
    prisma.recipe.count({ where }),
  ]);

  const data = recipes.map(({ favorites, ...r }) => ({
    ...r,
    isFavorite: favorites.length > 0,
  }));

  return NextResponse.json(buildPaginatedResponse(data, total, pagination));
}
