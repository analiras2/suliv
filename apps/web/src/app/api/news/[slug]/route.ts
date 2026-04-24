import { NextRequest, NextResponse } from "next/server";
import { NewsStatus, prisma } from "@suliv/db";
import { AuthError, requireAuth } from "../../../../lib/auth-middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await requireAuth(req);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    throw err;
  }

  const { slug } = await params;

  const article = await prisma.newsArticle.findFirst({
    where: {
      slug,
      status: NewsStatus.PUBLISHED,
      publishedAt: { lte: new Date() },
    },
  });

  if (!article) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ article });
}
