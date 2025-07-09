// src/app/api/github/callback/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    try {
        const res = await axios.post(
            `https://github.com/login/oauth/access_token`,
            {
                client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
                client_secret: process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET,
                code
            },
            {
                headers: {
                    Accept: 'application/json'
                }
            }
        );

        const token = res.data.access_token;

        // Redirect to /github with token in query param
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/github?token=${token}`);
    } catch (error) {
        console.error('OAuth exchange error:', error);
        return NextResponse.json({ error: 'OAuth callback failed' }, { status: 500 });
    }
}
