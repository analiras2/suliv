import { NextRequest, NextResponse } from "next/server"
import { OAuth2Client } from "google-auth-library"
import appleSignin from "apple-signin-auth"
import { prisma } from "@suliv/db"
import { signAccessToken, signRefreshToken, socialSchema } from "@suliv/auth"
import { createHash } from "node:crypto"

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

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

  const parsed = socialSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { provider, id_token } = parsed.data

  let providerSub: string
  let providerEmail: string
  let providerName: string | undefined

  try {
    if (provider === "google") {
      const ticket = await googleClient.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      const p = ticket.getPayload()!
      providerSub = p.sub
      providerEmail = p.email!
      providerName = p.name
    } else {
      const p = await appleSignin.verifyIdToken(id_token, {
        audience: process.env.APPLE_CLIENT_ID,
        ignoreExpiration: false,
      })
      providerSub = p.sub
      providerEmail = p.email!
    }
  } catch {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 })
  }

  let isNewUser = false
  let user: { id: string; email: string; name: string | null; profile: { onboardingCompleted: boolean } | null }

  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId: providerSub,
      },
    },
    include: {
      user: {
        include: { profile: true },
      },
    },
  })

  if (account) {
    user = account.user
    isNewUser = false
  } else {
    const existingUser = await prisma.user.findUnique({
      where: { email: providerEmail },
      include: { profile: true },
    })

    if (existingUser) {
      user = existingUser
      isNewUser = false
    } else {
      user = await prisma.user.create({
        data: {
          email: providerEmail,
          name: providerName ?? null,
          profile: {
            create: { onboardingCompleted: false },
          },
        },
        include: { profile: true },
      })
      isNewUser = true
    }

    await prisma.account.create({
      data: {
        userId: user.id,
        provider,
        providerAccountId: providerSub,
      },
    })
  }

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

  const hasProfile = user.profile?.onboardingCompleted === true

  return NextResponse.json(
    {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
      is_new_user: isNewUser,
      has_profile: hasProfile,
    },
    { status: isNewUser ? 201 : 200 }
  )
}
