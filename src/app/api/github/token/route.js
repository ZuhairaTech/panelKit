// src/app/api/github/token/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing GitHub client credentials in environment' }, { status: 500 });
    }

    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const { access_token } = tokenResponse.data;

    if (access_token) {
      return NextResponse.json({ token: access_token });
    } else {
      return NextResponse.json({ error: 'Token not found in response' }, { status: 500 });
    }
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 500 });
  }
}
