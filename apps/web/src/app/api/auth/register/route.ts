import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@suliv/db"
import { hashPassword, signAccessToken, signRefreshToken, registerSchema } from "@suliv/auth"
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

  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { email, password, name } = parsed.data

  try {
    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        passwordHash,
        profile: {
          create: {
            onboardingCompleted: false,
          },
        },
      },
      select: { id: true, email: true, name: true },
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

    return NextResponse.json(
      {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: { id: user.id, email: user.email, name: user.name },
        is_new_user: true,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error("[register] unexpected error:", err)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
