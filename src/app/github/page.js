'use client';

import { useState, useEffect } from 'react';
import GitHubAPI from '../../lib/github-api';

export default function GitHubPage() {
    const [repos, setRepos] = useState([]);
    const [user, setUser] = useState(null);
    const [starred, setStarred] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');

    useEffect(() => {
        // Get token from localStorage or URL params
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        const savedToken = localStorage.getItem('githubToken');
        
        if (urlToken) {
            setToken(urlToken);
            localStorage.setItem('githubToken', urlToken);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (savedToken) {
            setToken(savedToken);
        }
    }, []);

    useEffect(() => {
        if (token) {
            loadUserInfo();
        }
    }, [token]);

    const loadUserInfo = async () => {
        try {
            const api = new GitHubAPI(token);
            const userInfo = await api.getUserInfo();
            setUser(userInfo);
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    };

    const loadRepos = async () => {
        setLoading(true);
        try {
            const api = new GitHubAPI(token);
            const [reposData, starredData] = await Promise.all([
                api.listRepos(),
                api.getStarredRepos()
            ]);
            
            setRepos(reposData.repositories || []);
            setStarred(starredData || []);
        } catch (error) {
            console.error('Error loading repos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadChart = async () => {
        try {
            const api = new GitHubAPI(token);
            const data = await api.getCommitsChart();
            setChartData({
                labels: data.map(item => item.name),
                data: data.map(item => item.commits)
            });
        } catch (error) {
            console.error('Error loading chart:', error);
        }
    };

    const handleLogin = () => {
        window.location.href = 'https://github.com/login/oauth/authorize?client_id=Ov23liUSn6KNi2EZZGLh&scope=repo';
    };

    const handleLogout = () => {
        setToken('');
        setUser(null);
        setRepos([]);
        setStarred([]);
        setChartData(null);
        localStorage.removeItem('githubToken');
    };

    const toggleStar = async (repoName) => {
        try {
            const api = new GitHubAPI(token);
            const isStarred = starred.some(repo => repo.full_name === repoName);
            const action = isStarred ? 'unstar' : 'star';
            
            await api.toggleStar(repoName, action);
            
            // Update local state
            if (isStarred) {
                setStarred(starred.filter(repo => repo.full_name !== repoName));
            } else {
                const repo = repos.find(r => r.full_name === repoName);
                if (repo) setStarred([...starred, repo]);
            }
        } catch (error) {
            console.error('Error toggling star:', error);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold mb-4">GitHub Dashboard</h1>
                    <p className="mb-4">Connect your GitHub account to get started</p>
                    <button 
                        onClick={handleLogin}
                        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                    >
                        🔐 Connect to GitHub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">🚀 GitHub Dashboard</h1>
                        <button 
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                            🚪 Logout
                        </button>
                    </div>
                    
                    {user && (
                        <div className="mt-4 flex items-center">
                            <img 
                                src={user.avatar_url} 
                                alt="Avatar" 
                                className="w-12 h-12 rounded-full mr-4"
                            />
                            <div>
                                <h3 className="font-semibold">{user.login}</h3>
                                <p className="text-gray-600">{user.name || 'No name provided'}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex gap-4">
                        <button 
                            onClick={loadRepos}
                            disabled={loading}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : '📥 Load Repositories'}
                        </button>
                        <button 
                            onClick={loadChart}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            📊 Load Chart
                        </button>
                    </div>
                </div>

                {/* Repositories */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">📁 Repositories ({repos.length})</h2>
                    {repos.length === 0 ? (
                        <p className="text-gray-500">No repositories loaded. Click "Load Repositories" to fetch your repos.</p>
                    ) : (
                        <div className="space-y-4">
                            {repos.map(repo => {
                                const isStarred = starred.some(s => s.full_name === repo.full_name);
                                return (
                                    <div key={repo.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold">
                                                    <a 
                                                        href={repo.html_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {repo.full_name}
                                                    </a>
                                                    {isStarred && <span className="ml-2">⭐</span>}
                                                </h3>
                                                <p className="text-gray-600 mt-1">{repo.description || 'No description'}</p>
                                                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                                    <span>🔤 {repo.language || 'Unknown'}</span>
                                                    <span>⭐ {repo.stargazers_count || 0}</span>
                                                    <span>🍴 {repo.forks_count || 0}</span>
                                                    <span>📅 {new Date(repo.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => toggleStar(repo.full_name)}
                                                className={`px-3 py-1 rounded text-sm ${
                                                    isStarred 
                                                        ? 'bg-yellow-100 text-yellow-800' 
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {isStarred ? '⭐ Starred' : '⭐ Star'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Chart */}
                {chartData && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">📊 Commits Chart</h2>
                        <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                            <p className="text-gray-500">Chart data loaded: {chartData.labels.length} repositories</p>
                            {/* You can integrate Chart.js here */}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}