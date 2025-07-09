// src/app/api/github/repos/route.js
import { NextResponse } from 'next/server';
import GitHubAPI from '@/lib/github-api';

// Helper function to extract token from request
function getTokenFromRequest(request) {
    const authHeader = request.headers.get('authorization');
    const searchParams = request.nextUrl.searchParams;
    
    // Try different sources for the token
    if (authHeader) {
        return authHeader.replace('Bearer ', '').replace('token ', '');
    }
    
    if (searchParams.get('token')) {
        return searchParams.get('token');
    }
    
    return null;
}

// GET /api/github/repos - Get user repositories
export async function GET(request) {
    try {
        const token = getTokenFromRequest(request);
        
        if (!token) {
            return NextResponse.json(
                { error: 'GitHub token required' },
                { status: 401 }
            );
        }

        const api = new GitHubAPI(token);
        const repos = await api.listRepos();
        
        return NextResponse.json({ repositories: repos });
        
    } catch (error) {
        console.error('Error fetching repositories:', error);
        return NextResponse.json(
            { error: 'Failed to fetch repositories' },
            { status: 500 }
        );
    }
}

// POST /api/github/repos/issue - Create issue
export async function POST(request) {
    try {
        const token = getTokenFromRequest(request);
        
        if (!token) {
            return NextResponse.json(
                { error: 'GitHub token required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { repo, title, body: issueBody } = body;
        
        if (!repo || !title) {
            return NextResponse.json(
                { error: 'Repository and title are required' },
                { status: 400 }
            );
        }

        const api = new GitHubAPI(token);
        const issue = await api.createIssue(repo, title, issueBody);
        
        return NextResponse.json(issue);
        
    } catch (error) {
        console.error('Error creating issue:', error);
        return NextResponse.json(
            { error: 'Failed to create issue' },
            { status: 500 }
        );
    }
}

// Handle preflight requests
export async function OPTIONS(request) {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}