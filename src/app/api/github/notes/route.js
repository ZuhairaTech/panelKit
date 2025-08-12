import { NextResponse } from 'next/server'

// In-memory store for example only. Replace with DB.
const notes = new Map();

export async function POST(request) {
    const { repo, note } = await request.json();

    if (!repo || typeof note !== 'string') {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    notes.set(repo, note);
    return NextResponse.json({ success: true });
}

export async function GET(request) {
    const data = Array.from(notes.entries()).map(([repo, note]) => ({ repo, note }));
    return NextResponse.json(data);
}
