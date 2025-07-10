// src/app/github/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function GitHubPage() {
    const [user, setUser] = useState(null);
    const [repos, setRepos] = useState([]);
    const [starred, setStarred] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);
    
    const searchParams = useSearchParams();

    // Check for token in URL params or localStorage
    useEffect(() => {
        const urlCode = searchParams.get('code');
        const urlToken = searchParams.get('token');
        const storedToken = localStorage.getItem('githubToken');

        if (urlToken) {
            setToken(urlToken);
            localStorage.setItem('githubToken', urlToken);
            window.history.replaceState({}, document.title, '/github');
        } else if (storedToken) {
            setToken(storedToken);
        } else if (urlCode) {
            // Exchange code for token
            fetch(`/api/github/token?code=${urlCode}`)
                .then(res => res.json())
                .then(data => {
                    if (data.token) {
                        setToken(data.token);
                        localStorage.setItem('githubToken', data.token);
                        window.history.replaceState({}, document.title, '/github');
                    } else {
                        setError('Failed to fetch token');
                    }
                })
                .catch(err => {
                    console.error('Token exchange error:', err);
                    setError('Error during token exchange');
                });
        }
    }, [searchParams]);

    const overviewRef = useRef(null);
    const repositoriesRef = useRef(null);
    const starredRef = useRef(null);


    useEffect(() => {
    const handleScroll = () => {
        const sections = [
            { id: 'overview', ref: overviewRef },
            { id: 'repositories', ref: repositoriesRef },
            { id: 'starred', ref: starredRef },
        ];

        const scrollPosition = window.scrollY + 150; // Add offset for sticky nav

        for (let i = sections.length - 1; i >= 0; i--) {
            const sectionTop = sections[i].ref.current?.offsetTop || 0;
            if (scrollPosition >= sectionTop) {
                setActiveTab(sections[i].id);
                break;
            }
        }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
}, []);


    // Load user data when token is available
    useEffect(() => {
        if (token) {
            loadUserData();
        }
    }, [token]);

    const loadUserData = async () => {
        if (!token) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Load user info
            const userResponse = await fetch('/api/github/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                setUser(userData);
            }

            // Load repositories
            const reposResponse = await fetch('/api/github/repos', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (reposResponse.ok) {
                const reposData = await reposResponse.json();
                setRepos(reposData.repositories || []);
            }

            // Load starred repositories
            const starredResponse = await fetch('/api/github/starred', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (starredResponse.ok) {
               const starredData = await starredResponse.json(); 
                setStarred(starredData.starred || []);
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
            setError('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23liUSn6KNi2EZZGLh';
        const redirectUri = encodeURIComponent(window.location.origin + '/github');
        const scope = 'user,repo,read:user,user:email';
        
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    };

    const handleLogout = () => {
        localStorage.removeItem('githubToken');
        setToken(null);
        setUser(null);
        setRepos([]);
        setStarred([]);
        window.location.reload();
    };

    const createIssue = async (repoName, title, body) => {
        if (!token) return;
        
        try {
            const response = await fetch('/api/github/repos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    repo: repoName,
                    title,
                    body
                })
            });
            
            if (response.ok) {
                const issue = await response.json();
                alert('Issue created successfully!');
                return issue;
            } else {
                throw new Error('Failed to create issue');
            }
        } catch (error) {
            console.error('Error creating issue:', error);
            alert('Failed to create issue');
        }
    };

    const scrollToSection = (tab) => {
        const sectionMap = {
            overview: overviewRef,
            repositories: repositoriesRef,
            starred: starredRef,
        };
        sectionMap[tab]?.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };


    if (!token) {
        return (
          <main className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">🌐 GitHub Dashboard</h1>

            <nav className="fixed top-0 left-0 h-screen w-48 bg-white dark:bg-gray-800 border-r border-gray-200 p-4 shadow-lg z-10">
                <div className="flex flex-col space-y-4 mt-20">
                    <button
                        onClick={handleLogin}
                        className="text-left cursor-pointer border p-3 rounded-lg text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Login
                    </button>
                </div>
            </nav>
          </main>
        );
    }

    return (
        <main className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">🌐 GitHub Dashboard</h1>
            </div>
            
            {/* Tabs */}
            <nav className="fixed top-0 left-0 h-screen w-48 bg-white dark:bg-gray-800 border-r border-gray-200 p-4 shadow-lg z-10">
                <div className="flex flex-col space-y-4 mt-20">
                    {['overview', 'repositories', 'starred'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => scrollToSection(tab)}
                            className={`text-left cursor-pointer border p-3 rounded-lg transition ${
                                activeTab === tab
                                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="flex flex-col space-y-4 mt-20">
                    <button
                        onClick={handleLogout}
                        className="text-left cursor-pointer border p-3 rounded-lg bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Logout
                    </button>
                </div>
                
            </nav>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Content */}
            {!loading && !error && (
                <>
                    {/* Overview Tab */}
                    <div ref={overviewRef} className="rounded-lg shadow-lg p-6">
                        {user ? (
                        <div className="rounded-lg shadow-lg p-6">
                            <div className="flex items-center space-x-6">
                                <img
                                    src={user.avatar_url}
                                    alt={user.login}
                                    className="w-24 h-24 rounded-full border-4 border-blue-500"
                                />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-100">{user.name || user.login}</h2>
                                    <p className="text-gray-600">@{user.login}</p>
                                    <p className="text-gray-600 mt-2">{user.bio || 'No bio available'}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <div className="text-3xl font-bold text-blue-600">{repos.length}</div>
                                    <div className="text-gray-600">Repositories</div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <div className="text-3xl font-bold text-blue-600">{user.followers}</div>
                                    <div className="text-gray-600">Followers</div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <div className="text-3xl font-bold text-blue-600">{user.following}</div>
                                    <div className="text-gray-600">Following</div>
                                </div>
                            </div>
                        </div>
                        ) : (
                            <p className="text-gray-400">Loading user info…</p>
                        )}
                        </div>

                    {/* Repositories Tab */}
                    <div ref={repositoriesRef} className="rounded-lg shadow-lg p-6 mt-10">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Repositories ({repos.length})</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {repos.map((repo) => (
                                    <div key={repo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-semibold text-lg text-blue-600 hover:text-blue-800">
                                                <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                                                    {repo.name}
                                                </a>
                                            </h3>
                                            {repo.private && (
                                                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                                                    Private
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 text-sm mb-3">{repo.description || 'No description'}</p>
                                        <div className="flex justify-between items-center text-sm text-gray-500">
                                            <div className="flex items-center space-x-4">
                                                {repo.language && (
                                                    <span className="flex items-center">
                                                        <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                                                        {repo.language}
                                                    </span>
                                                )}
                                                <span>⭐ {repo.stargazers_count}</span>
                                                <span>🔧 {repo.forks_count}</span>
                                            </div>
                                            <button
                                                onClick={() => createIssue(repo.full_name, 'New Issue', 'Created from dashboard')}
                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Create Issue
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Starred Tab */}
                    <div ref={starredRef} className="rounded-lg shadow-lg p-6 mt-10">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Starred Repositories ({starred.length})</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {starred.map((repo) => (
                                    <div key={repo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <h3 className="font-semibold text-lg text-blue-600 hover:text-blue-800 mb-3">
                                            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                                                {repo.full_name}
                                            </a>
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-3">{repo.description || 'No description'}</p>
                                        <div className="flex justify-between items-center text-sm text-gray-500">
                                            <div className="flex items-center space-x-4">
                                                {repo.language && (
                                                    <span className="flex items-center">
                                                        <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                                                        {repo.language}
                                                    </span>
                                                )}
                                                <span>⭐ {repo.stargazers_count}</span>
                                            </div>
                                            <span className="text-yellow-500">★ Starred</span>
                                        </div>
                                    </div>  
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )} 
        </main>
    );
}
//     }