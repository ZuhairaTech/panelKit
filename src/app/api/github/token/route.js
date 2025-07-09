import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import axios from 'axios'

export async function GET() {
  try {
    const appId = process.env.APP_ID
    const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
    const installationId = process.env.INSTALLATION_ID

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iat: now - 60,
      exp: now + 10 * 60,
      iss: appId
    }

    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' })

    const tokenResponse = await axios.post(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      }
    )

    const accessToken = tokenResponse.data.token
    return NextResponse.json({ accessToken })
  } catch (error) {
    console.error(error)
    return new NextResponse('Error generating token', { status: 500 })
  }
}
