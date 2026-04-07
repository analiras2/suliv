import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@suliv/db"
import { onboardingSchema } from "@suliv/auth"
import { requireAuth, AuthError } from "../../../../lib/auth-middleware"

export async function POST(req: NextRequest) {
  let userId: string
  try {
    const auth = await requireAuth(req)
    userId = auth.userId
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    throw err
  }

  const body = await req.json().catch(() => null)
  const parsed = onboardingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    update: {
      ...parsed.data,
      onboardingCompleted: true,
    },
    create: {
      userId,
      ...parsed.data,
      onboardingCompleted: true,
    },
  })

  return NextResponse.json({ profile })
}
