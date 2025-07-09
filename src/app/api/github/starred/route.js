// src/app/api/github/starred/route.js
import { NextResponse } from 'next/server';
import GitHubAPI from '@/lib/github-api';

// Helper function to extract token from request
function getTokenFromRequest(request) {
    const authHeader = request.headers.get('authorization');
    const searchParams = request.nextUrl.searchParams;
    
    if (authHeader) {
        return authHeader.replace('Bearer ', '').replace('token ', '');
    }
    
    if (searchParams.get('token')) {
        return searchParams.get('token');
    }
    
    return null;
}

// GET /api/github/starred - Get starred repositories
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
        const starred = await api.getStarredRepos();
        
        return NextResponse.json({ starred });
        
    } catch (error) {
        console.error('Error fetching starred repos:', error);
        return NextResponse.json(
            { error: 'Failed to fetch starred repos' },
            { status: 500 }
        );
    }
}

// Handle preflight requests
export async function OPTIONS(request) {
    return new Response(null, {
        status: 2,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}