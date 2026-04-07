import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@suliv/db"
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@suliv/auth"
import { createHash } from "node:crypto"
import { z } from "zod"

const bodySchema = z.object({ refresh_token: z.string().min(1) })

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "validation_error" }, { status: 422 })

  const { refresh_token } = parsed.data

  // 1. Verify JWT
  let userId: string
  try {
    const payload = await verifyRefreshToken(refresh_token)
    userId = payload.userId
  } catch {
    return NextResponse.json({ error: "invalid_refresh_token" }, { status: 401 })
  }

  // 2. Check token in DB
  const tokenHash = createHash("sha256").update(refresh_token).digest("hex")
  const storedToken = await prisma.refreshToken.findUnique({ where: { tokenHash } })

  if (!storedToken || storedToken.revokedAt !== null || storedToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "invalid_refresh_token" }, { status: 401 })
  }

  // 3. Rotate: revoke old token
  await prisma.refreshToken.update({ where: { id: storedToken.id }, data: { revokedAt: new Date() } })

  // 4. Issue new token pair
  const newAccessToken = await signAccessToken({ sub: userId })
  const newRefreshToken = await signRefreshToken(userId)
  const newTokenHash = createHash("sha256").update(newRefreshToken).digest("hex")
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await prisma.refreshToken.create({ data: { userId, tokenHash: newTokenHash, expiresAt } })

  return NextResponse.json({ access_token: newAccessToken, refresh_token: newRefreshToken })
}
