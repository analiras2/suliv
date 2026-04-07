import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@suliv/db";
import { profileUpdateSchema } from "@suliv/auth";
import { requireAuth, AuthError } from "../../lib/auth-middleware";

export async function GET(req: NextRequest) {
  let userId: string;
  try {
    ({ userId } = await requireAuth(req));
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }

  const profile = await prisma.userProfile.findUnique({ where: { userId } });

  if (!profile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  let userId: string;
  try {
    ({ userId } = await requireAuth(req));
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }

  const body = await req.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const existing = await prisma.userProfile.findUnique({ where: { userId } });

  if (!existing) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  const profile = await prisma.userProfile.update({
    where: { userId },
    data: parsed.data,
  });

  return NextResponse.json({ profile });
}
