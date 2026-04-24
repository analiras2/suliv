import { NextRequest, NextResponse } from "next/server";
import { NewsStatus, prisma } from "@suliv/db";
import { AuthError, requireAuth } from "../../../lib/auth-middleware";
import {
  buildPaginatedResponse,
  parsePaginationParams,
  toPrismaSkipTake,
} from "../../../lib/pagination";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw err;
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const pagination = parsePaginationParams({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
  const { skip, take } = toPrismaSkipTake(pagination);
  const now = new Date();

  const where = {
    status: NewsStatus.PUBLISHED,
    publishedAt: { lte: now },
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { excerpt: { contains: q, mode: "insensitive" as const } },
            { tags: { has: q.toLowerCase() } },
          ],
        }
      : {}),
  };

  const [articles, total] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      skip,
      take,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      select: {
        id: true,
        slug: true,
        kicker: true,
        title: true,
        excerpt: true,
        tags: true,
        coverImageUrl: true,
        authorName: true,
        authorRole: true,
        readTimeMin: true,
        publishedAt: true,
      },
    }),
    prisma.newsArticle.count({ where }),
  ]);

  return NextResponse.json(buildPaginatedResponse(articles, total, pagination));
}
