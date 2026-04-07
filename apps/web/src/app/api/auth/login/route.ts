import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@suliv/db"
import { comparePassword, signAccessToken, signRefreshToken, loginSchema } from "@suliv/auth"
import { createHash } from "node:crypto"

export async function POST(req: NextRequest) {
  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "validation_error", details: { formErrors: ["Invalid JSON body"], fieldErrors: {} } },
      { status: 422 }
    )
  }

  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      profile: { select: { onboardingCompleted: true } },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 })
  }

  const passwordValid = await comparePassword(password, user.passwordHash ?? "")

  if (!passwordValid) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 })
  }

  // Revoke all existing active refresh tokens for this user
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  })

  const accessToken = await signAccessToken({ sub: user.id, email: user.email })
  const refreshToken = await signRefreshToken(user.id)

  const tokenHash = createHash("sha256").update(refreshToken).digest("hex")
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  })

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    user: { id: user.id, email: user.email, name: user.name },
    has_profile: user.profile?.onboardingCompleted ?? false,
  })
}
