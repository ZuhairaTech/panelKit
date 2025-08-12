'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CommitsChart from '../../../components/CommitsChart';

// Wrapper component for Suspense
export default function GitHubPage() {
    return (
        <Suspense fallback={<div>Loading GitHub data...</div>}>
            <GitHubContent />
        </Suspense>
    );
}

// Actual page content
function GitHubContent() {
    const [user, setUser] = useState(null);
    const [repos, setRepos] = useState([]);
    const [starred, setStarred] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [issueTitle, setIssueTitle] = useState('');
    const [issueBody, setIssueBody] = useState('');
    const [selectedRepo, setSelectedRepo] = useState(null);

    const [notes, setNotes] = useState({});
    const [commitLabels, setCommitLabels] = useState([]);
    const [commitCounts, setCommitCounts] = useState([]);

    const [activeNoteTab, setActiveNoteTab] = useState(starred[0]?.full_name || '');

    const searchParams = useSearchParams();

    // Check for token in URL params or localStorage
    useEffect(() => {
        const urlCode = searchParams.get('code');
        const urlToken = searchParams.get('token');
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('githubToken') : null;

        if (urlToken) {
            setToken(urlToken);
            if (typeof window !== 'undefined') {
                localStorage.setItem('githubToken', urlToken);
                window.history.replaceState({}, document.title, '/github');
            }
        } else if (storedToken) {
            setToken(storedToken);
        } else if (urlCode) {
            // Exchange code for token
            fetch(`/api/github/token?code=${urlCode}`)
                .then(res => res.json())
                .then(data => {
                    if (data.token) {
                        setToken(data.token);
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('githubToken', data.token);
                            window.history.replaceState({}, document.title, '/github');
                        }
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


    useEffect(() => {
        if (!token || starred.length === 0) return;

        const loadCommits = async () => {
            try {
            const commitData = await Promise.all(
                starred.map(async (repo) => {
                const res = await fetch(`https://api.github.com/repos/${repo.full_name}/commits?per_page=1`, {
                    headers: { Authorization: `token ${token}` }
                });

                const linkHeader = res.headers.get('Link');
                let total = 0;

                if (linkHeader && linkHeader.includes('rel="last"')) {
                    const lastPageUrl = linkHeader.split(',').find(s => s.includes('rel="last"')).split(';')[0].trim().slice(1, -1);
                    const urlParams = new URLSearchParams(new URL(lastPageUrl).search);
                    total = parseInt(urlParams.get('page'));
                } else {
                    const commits = await res.json();
                    total = commits.length;
                }

                return { name: repo.name, commits: total };
                })
            );

            setCommitLabels(commitData.map(d => d.name));
            setCommitCounts(commitData.map(d => d.commits));
            } catch (error) {
            console.error('Error fetching commit data:', error);
            }
        };

        loadCommits();
    }, [starred, token]); // this auto-runs when starred/token change


    // Load user data when token is available
    useEffect(() => {
        if (token) {
            loadUserData();
        }
    }, [token]);

    // Load on mount
    useEffect(() => {
        const stored = localStorage.getItem('starredRepos');
        if (stored) {
            setStarred(JSON.parse(stored));
        }
    }, []);

    // Save on update
    useEffect(() => {
        localStorage.setItem('starredRepos', JSON.stringify(starred));
    }, [starred]);

    // Load notes on first load
    useEffect(() => {
        const storedNotes = localStorage.getItem("git_notes");
        if (storedNotes) {
            setNotes(JSON.parse(storedNotes));
        }
    }, []);

    // Save notes whenever they change
    useEffect(() => {
        if (notes) {
            localStorage.setItem("git_notes", JSON.stringify(notes));
        }
    }, [notes]);

    const handleNoteChange = async (repoFullName, value) => {
        setNotes(prev => {
            const updated = { ...prev, [repoFullName]: value };
            localStorage.setItem("git_notes", JSON.stringify(updated));
            return updated;
        });

        // Optional: Send to backend
        try {
            await fetch('/api/github/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                repo: repoFullName,
                note: value,
            }),
            });
        } catch (err) {
            console.error("Failed to save note to server", err);
        }
    };


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
        if (typeof window !== 'undefined') {
            localStorage.removeItem('githubToken');
        }
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

    const toggleStar = async (repo) => {
        const isStarred = starred.some(r => r.full_name === repo.full_name);
        const method = isStarred ? 'DELETE' : 'PUT';

        try {
            const response = await fetch(`/api/github/starred?repo=${repo.full_name}`, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                if (isStarred) {
                    setStarred(prev => prev.filter(r => r.full_name !== repo.full_name));
                } else {
                    setStarred(prev => [...prev, repo]); // Store full object
                }
            } else {
                const error = await response.json();
                console.error('Toggle failed:', error);
            }
        } catch (error) {
            console.error('Error toggling star:', error);
        }
    };


    if (!token) {
        return (
            <div className="panelkit-container">
                {/* Sidebar */}
                <div className="panelkit-sidebar">
                    <div className="sidebar-section">
                        <div className="sidebar-header">
                            📁 Navigation
                        </div>
                        <Link href="/">
                            <div className="sidebar-item">
                                <span>🏠</span> Home
                            </div>
                        </Link>
                        <div className="sidebar-item active">
                            <span>💻</span> GitHub
                        </div>
                    </div>
                    
                    <div className="sidebar-section">
                        <div className="sidebar-header">
                            🔐 Authentication
                        </div>
                        <button onClick={handleLogin} className="sidebar-item" style={{ width: '100%' }}>
                            <span>🚀</span> Login to GitHub
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="panelkit-main">
                    <div className="panelkit-tabs">
                        <div className="panelkit-tab active">
                            <span>💻</span>
                            <span>GitHub Authentication</span>
                        </div>
                    </div>

                    <div className="panelkit-content">
                        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                            <h1 style={{ 
                                fontSize: '32px', 
                                fontWeight: '600', 
                                marginBottom: '16px',
                                color: 'var(--panelkit-text)'
                            }}>
                                💻 GitHub Dashboard
                            </h1>
                            
                            <p style={{ 
                                fontSize: '16px', 
                                color: 'var(--panelkit-text-muted)',
                                marginBottom: '32px',
                                lineHeight: '1.5'
                            }}>
                                Connect your GitHub account to access repositories, view statistics, and manage your projects.
                            </p>

                            <div className="panelkit-card" style={{ marginBottom: '24px', textAlign: 'left' }}>
                                <h3 style={{ marginBottom: '12px', color: 'var(--panelkit-text)' }}>
                                    🔑 Required Permissions
                                </h3>
                                <ul style={{ 
                                    color: 'var(--panelkit-text-muted)', 
                                    fontSize: '14px',
                                    lineHeight: '1.6'
                                }}>
                                    <li>Read user profile information</li>
                                    <li>Access public and private repositories</li>
                                    <li>View starred repositories</li>
                                    <li>Create issues in repositories</li>
                                </ul>
                            </div>

                            <button 
                                onClick={handleLogin}
                                className="panelkit-button"
                                style={{ 
                                    fontSize: '16px',
                                    padding: '12px 24px'
                                }}
                            >
                                🚀 Connect GitHub Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    // Helper function to parse inline markdown formatting including code
    const parseInlineMarkdown = (text) => {
        const segments = [];
        let currentIndex = 0;
        
        // Combined regex to match inline code first, then other markdown patterns
        const combinedRegex = /(`[^`]+`)|(\*{1,3})(.*?)\2/g;
        let match;
        
        while ((match = combinedRegex.exec(text)) !== null) {
            // Add text before the match
            if (match.index > currentIndex) {
                segments.push({
                    type: 'text',
                    content: text.slice(currentIndex, match.index)
                });
            }
            
            if (match[1]) {
                // Inline code match
                const content = match[1].slice(1, -1); // Remove backticks
                segments.push({ type: 'code', content });
            } else {
                // Bold/italic match
                const asteriskCount = match[2].length;
                const content = match[3];
                
                if (asteriskCount === 3) {
                    segments.push({ type: 'bold-italic', content });
                } else if (asteriskCount === 2) {
                    segments.push({ type: 'bold', content });
                } else {
                    segments.push({ type: 'italic', content });
                }
            }
            
            currentIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (currentIndex < text.length) {
            segments.push({
                type: 'text',
                content: text.slice(currentIndex)
            });
        }
        
        return segments;
    };

    // Helper function to render parsed segments
    const renderFormattedText = (segments) => {
        if (segments.length === 1 && segments[0].type === 'text') {
            return segments[0].content;
        }
        
        return segments.map((segment, segmentIndex) => {
            switch (segment.type) {
                case 'bold':
                    return <strong key={segmentIndex}>{segment.content}</strong>;
                case 'italic':
                    return <em key={segmentIndex}>{segment.content}</em>;
                case 'bold-italic':
                    return <strong key={segmentIndex}><em>{segment.content}</em></strong>;
                case 'code':
                    return (
                        <code key={segmentIndex} style={{
                            backgroundColor: 'var(--panelkit-background-secondary, #f5f5f5)',
                            border: '1px solid var(--panelkit-border, #e0e0e0)',
                            borderRadius: '4px',
                            padding: '2px 4px',
                            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                            fontSize: '0.9em',
                            color: 'var(--panelkit-text, #333)'
                        }}>
                            {segment.content}
                        </code>
                    );
                default:
                    return segment.content;
            }
        });
    };

    // Function to handle note formatting
    const formatNote = (text) => {
        const lines = text.split('\n');
        const result = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // Handle code blocks
            if (line.trim().startsWith('```')) {
                const language = line.trim().slice(3).trim() || 'text';
                let codeContent = [];
                let j = i + 1;
                
                // Find the closing ```
                while (j < lines.length && !lines[j].trim().startsWith('```')) {
                    codeContent.push(lines[j]);
                    j++;
                }
                
                result.push(
                    <pre key={i} style={{
                        backgroundColor: 'var(--panelkit-background-secondary, #f8f8f8)',
                        border: '1px solid var(--panelkit-border, #e0e0e0)',
                        borderRadius: '6px',
                        padding: '16px',
                        margin: '8px 0',
                        overflow: 'auto',
                        fontSize: '14px',
                        lineHeight: '1.4'
                    }}>
                        {language !== 'text' && (
                            <div style={{
                                fontSize: '12px',
                                color: 'var(--panelkit-text-secondary, #666)',
                                marginBottom: '8px',
                                fontWeight: '500'
                            }}>
                                {language}
                            </div>
                        )}
                        <code style={{
                            fontFamily: 'monospace',
                            color: '#3c3c3c',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {codeContent.join('\n')}
                        </code>
                    </pre>
                );
                
                i = j + 1; // Skip to after the closing ```
                continue;
            }

            // Handle checkboxes
            if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
                const isChecked = line.includes('[x]');
                const content = line.replace(/^- \[[x\s]\]\s*/, '');
                const formattedContent = parseInlineMarkdown(content);
                result.push(
                    <div key={i} style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '8px', 
                        marginBottom: '4px' 
                    }}>
                        <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => {
                                const newText = text.split('\n');
                                newText[i] = `- [${e.target.checked ? 'x' : ' '}] ${content}`;
                                handleNoteChange(activeTab, newText.join('\n'));
                            }}
                            style={{ marginTop: '2px' }}
                        />
                        <span style={{ 
                            textDecoration: isChecked ? 'line-through' : 'none',
                            opacity: isChecked ? 0.6 : 1 
                        }}>
                            {renderFormattedText(formattedContent)}
                        </span>
                    </div>
                );
            }
            
            // Handle bullet points
            else if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
                const content = line.replace(/^[•\-]\s*/, '');
                const formattedContent = parseInlineMarkdown(content);
                result.push(
                    <div key={i} style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '8px', 
                        marginBottom: '4px' 
                    }}>
                        <span style={{ color: 'var(--panelkit-accent)', fontWeight: 'bold' }}>•</span>
                        <span>{renderFormattedText(formattedContent)}</span>
                    </div>
                );
            }
            
            // Handle headers
            else if (line.trim().startsWith('# ')) {
                const content = line.replace(/^#\s*/, '');
                const formattedContent = parseInlineMarkdown(content);
                result.push(
                    <h2 key={i} style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: 'var(--panelkit-text)',
                        margin: '20px 0 10px 0'
                    }}>
                        {renderFormattedText(formattedContent)}
                    </h2>
                );
            }

            else if (line.trim().startsWith('## ')) {
                const content = line.replace(/^##\s*/, '');
                const formattedContent = parseInlineMarkdown(content);
                result.push(
                    <h3 key={i} style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: 'var(--panelkit-text)',
                        margin: '16px 0 8px 0'
                    }}>
                        {renderFormattedText(formattedContent)}
                    </h3>
                );
            }

            else if (line.trim().startsWith('### ')) {
                const content = line.replace(/^###\s*/, '');
                const formattedContent = parseInlineMarkdown(content);
                result.push(
                    <h4 key={i} style={{
                        fontSize: '18px',
                        fontWeight: '500',
                        color: 'var(--panelkit-text)',
                        margin: '14px 0 6px 0'
                    }}>
                        {renderFormattedText(formattedContent)}
                    </h4>
                );
            }

            else if (line.trim().startsWith('#### ')) {
                const content = line.replace(/^####\s*/, '');
                const formattedContent = parseInlineMarkdown(content);
                result.push(
                    <h5 key={i} style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: 'var(--panelkit-text)',
                        margin: '12px 0 6px 0',
                        fontStyle: 'italic'
                    }}>
                        {renderFormattedText(formattedContent)}
                    </h5>
                );
            }
            
            // Regular text
            else {
                result.push(line.trim() ? (
                    <p key={i} style={{ margin: '0 0 4px 0', lineHeight: '1.4' }}>
                        {renderFormattedText(parseInlineMarkdown(line))}
                    </p>
                ) : (
                    <br key={i} />
                ));
            }

            i++;
        }

        return result;
    };

    return (
        <div className="panelkit-container">
            {/* Sidebar */}
            <div className="panelkit-sidebar">
                <div className="sidebar-section">
                    <div className="sidebar-header">
                        📁 Navigation
                    </div>
                    <Link href="/">
                        <div className="sidebar-item">
                            <span>🏠</span> Home
                        </div>
                    </Link>
                    <div className="sidebar-item active">
                        <span>💻</span> GitHub
                    </div>
                </div>

                {user && (
                    <div className="sidebar-section">
                        <div className="sidebar-header">
                            👤 {user.login}
                        </div>
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
                        >
                            <span>📊</span> Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('repositories')}
                            className={`sidebar-item ${activeTab === 'repositories' ? 'active' : ''}`}
                        >
                            <span>📂</span> Repositories ({repos.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('starred')}
                            className={`sidebar-item ${activeTab === 'starred' ? 'active' : ''}`}
                        >
                            <span>⭐</span> Starred ({starred.length})
                        </button>
                    </div>
                )}

                <div className="sidebar-section">
                    <div className="sidebar-header">
                        ⚙️ Actions
                    </div>
                    <button onClick={handleLogout} className="sidebar-item">
                        <span>🚪</span> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="panelkit-main">
                <div className="panelkit-tabs">
                    <div className="panelkit-tab active">
                        <span>💻</span>
                        <span>GitHub Dashboard</span>
                    </div>
                </div>

                <div className="panelkit-content">
                    {/* Loading State */}
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                border: '3px solid var(--panelkit-border)',
                                borderTop: '3px solid var(--panelkit-accent)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 16px'
                            }}></div>
                            <p style={{ color: 'var(--panelkit-text-muted)' }}>Loading GitHub data...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="panelkit-card" style={{ 
                            borderColor: '#f44336',
                            backgroundColor: 'rgba(244, 67, 54, 0.1)',
                            marginBottom: '24px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>❌</span>
                                <span style={{ color: '#f44336', fontWeight: '600' }}>Error</span>
                            </div>
                            <p style={{ color: 'var(--panelkit-text)', marginTop: '8px' }}>{error}</p>
                        </div>
                    )}

                    {/* Content Sections */}
                    {!loading && !error && (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && user && (
                                <div>
                                    <h1 style={{ 
                                        fontSize: '24px', 
                                        fontWeight: '600', 
                                        marginBottom: '24px',
                                        color: 'var(--panelkit-text)'
                                    }}>
                                        📊 Profile Overview
                                    </h1>

                                    <div className="panelkit-card" style={{ marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                                            <img
                                                src={user.avatar_url}
                                                alt={user.login}
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    borderRadius: '50%',
                                                    border: '3px solid var(--panelkit-accent)'
                                                }}
                                            />
                                            <div>
                                                <h2 style={{ 
                                                    fontSize: '20px', 
                                                    fontWeight: '600',
                                                    color: 'var(--panelkit-text)',
                                                    marginBottom: '4px'
                                                }}>
                                                    {user.name || user.login}
                                                </h2>
                                                <p style={{ 
                                                    color: 'var(--panelkit-text-muted)',
                                                    marginBottom: '8px'
                                                }}>
                                                    @{user.login}
                                                </p>
                                                <p style={{ color: 'var(--panelkit-text-muted)' }}>
                                                    {user.bio || 'No bio available'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                                            gap: '16px'
                                        }}>
                                            <div className="code-block" style={{ textAlign: 'center' }}>
                                                <div style={{ 
                                                    fontSize: '24px', 
                                                    fontWeight: '600', 
                                                    color: 'var(--panelkit-accent)' 
                                                }}>
                                                    {repos.length}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: 'var(--panelkit-text-muted)' 
                                                }}>
                                                    Repositories
                                                </div>
                                            </div>
                                            <div className="code-block" style={{ textAlign: 'center' }}>
                                                <div style={{ 
                                                    fontSize: '24px', 
                                                    fontWeight: '600', 
                                                    color: 'var(--panelkit-accent)' 
                                                }}>
                                                    {user.followers}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: 'var(--panelkit-text-muted)' 
                                                }}>
                                                    Followers
                                                </div>
                                            </div>
                                            <div className="code-block" style={{ textAlign: 'center' }}>
                                                <div style={{ 
                                                    fontSize: '24px', 
                                                    fontWeight: '600', 
                                                    color: 'var(--panelkit-accent)' 
                                                }}>
                                                    {user.following}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '12px', 
                                                    color: 'var(--panelkit-text-muted)' 
                                                }}>
                                                    Following
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}


                            {/* Repositories Tab */}
                            {activeTab === 'repositories' && (
                                <div>
                                    <h1 style={{ 
                                        fontSize: '24px', 
                                        fontWeight: '600', 
                                        marginBottom: '24px',
                                        color: 'var(--panelkit-text)'
                                    }}>
                                        📂 Repositories ({repos.length})
                                    </h1>
                                    
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                                        gap: '16px' 
                                    }}>
                                        {repos.map((repo) => (
                                            <div key={repo.id} className="panelkit-card" style={{
                                                transition: 'all 0.2s',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => e.target.style.borderColor = 'var(--panelkit-accent)'}
                                            onMouseLeave={(e) => e.target.style.borderColor = 'var(--panelkit-border)'}
                                            >
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'flex-start',
                                                    marginBottom: '12px'
                                                }}>
                                                    <h3 style={{ 
                                                        fontSize: '16px', 
                                                        fontWeight: '600', 
                                                        color: 'var(--panelkit-accent)' 
                                                    }}>
                                                        <a 
                                                            href={repo.html_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            style={{ 
                                                                color: 'inherit', 
                                                                textDecoration: 'none' 
                                                            }}
                                                        >
                                                            📁 {repo.name}
                                                        </a>
                                                    </h3>
                                                    {repo.private && (
                                                        <span style={{
                                                            backgroundColor: '#ff9800',
                                                            color: 'white',
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            padding: '2px 6px',
                                                            borderRadius: '3px'
                                                        }}>
                                                            Private
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <p style={{ 
                                                    color: 'var(--panelkit-text-muted)', 
                                                    fontSize: '14px', 
                                                    marginBottom: '16px',
                                                    minHeight: '40px'
                                                }}>
                                                    {repo.description || 'No description available'}
                                                </p>
                                                
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    fontSize: '12px',
                                                    color: 'var(--panelkit-text-muted)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        {repo.language && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{
                                                                    width: '8px',
                                                                    height: '8px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: 'var(--panelkit-accent)'
                                                                }}></span>
                                                                {repo.language}
                                                            </span>
                                                        )}
                                                        <span
                                                            onClick={() => toggleStar(repo)}
                                                            style={{
                                                                cursor: 'pointer',
                                                                color: starred.some((r) => r.full_name === repo.full_name) ? 'gold' : 'gray',
                                                                userSelect: 'none',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                            title={starred.some((r) => r.full_name === repo.full_name) ? 'Unstar' : 'Star'}
                                                        >
                                                            <span>{starred.some((r) => r.full_name === repo.full_name) ? '★' : '☆'}</span>
                                                           
                                                        </span>

                                                        <span>🔧 {repo.forks_count}</span>
                                                    </div>
                                                  
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRepo(repo.full_name);
                                                            setShowModal(true);
                                                        }}
                                                        className="panelkit-button"
                                                        style={{ fontSize: '11px', padding: '4px 8px' }}
                                                    >
                                                        Create Issue
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {showModal && (
                                <div className="modal-overlay">
                                    <div className="modal">
                                        <h2>Create New Issue</h2>
                                        <input
                                            type="text"
                                            placeholder="Issue title"
                                            value={issueTitle}
                                            onChange={(e) => setIssueTitle(e.target.value)}
                                            style={{ width: '100%', marginBottom: '8px' }}
                                        />
                                        <textarea
                                            placeholder="Issue description"
                                            value={issueBody}
                                            onChange={(e) => setIssueBody(e.target.value)}
                                            style={{ width: '100%', height: '80px' }}
                                        />
                                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button onClick={() => setShowModal(false)} style={{ marginRight: '8px' }}>
                                                Cancel
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    await createIssue(selectedRepo, issueTitle, issueBody);
                                                    setShowModal(false);
                                                    setIssueTitle('');
                                                    setIssueBody('');
                                                }}
                                            >
                                                Submit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Starred Tab */}
                            {activeTab === 'starred' && (
                                 <div style={{ 
                                    display: 'flex', 
                                    height: '600px',
                                    border: '1px solid var(--panelkit-border)',
                                    borderRadius: '8px',
                                    overflow: 'hidden'
                                }}>
                                    {/* Sidebar with tabs */}
                                    <div style={{ 
                                        width: '280px', 
                                        backgroundColor: 'var(--panelkit-bg-secondary, rgba(0,0,0,0.02))',
                                        borderRight: '1px solid var(--panelkit-border)',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        <div style={{ 
                                            padding: '16px', 
                                            borderBottom: '1px solid var(--panelkit-border)',
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: 'var(--panelkit-text)'
                                        }}>
                                            Repository Notes
                                        </div>
                                        
                                        <div style={{ 
                                            flex: 1, 
                                            overflowY: 'auto',
                                            padding: '8px 0'
                                        }}>
                                            {starred.map((repo) => (
                                                <div 
                                                    key={repo.full_name}
                                                    onClick={() => setActiveNoteTab(repo.full_name)}
                                                    style={{
                                                        padding: '12px 16px',
                                                        cursor: 'pointer',
                                                        backgroundColor: activeNoteTab === repo.full_name ? 'var(--panelkit-accent-bg, rgba(59, 130, 246, 0.1))' : 'transparent',
                                                        borderLeft: activeNoteTab === repo.full_name ? '3px solid var(--panelkit-accent)' : '3px solid transparent',
                                                        transition: 'all 0.2s',
                                                        ':hover': {
                                                            backgroundColor: 'var(--panelkit-hover, rgba(0,0,0,0.05))'
                                                        }
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (activeNoteTab !== repo.full_name) {
                                                            e.target.style.backgroundColor = 'var(--panelkit-hover, rgba(0,0,0,0.05))';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (activeNoteTab !== repo.full_name) {
                                                            e.target.style.backgroundColor = 'transparent';
                                                        }
                                                    }}
                                                >
                                                    <div style={{ 
                                                        fontSize: '14px', 
                                                        fontWeight: '500',
                                                        color: activeNoteTab === repo.full_name ? 'var(--panelkit-accent)' : 'var(--panelkit-text)',
                                                        marginBottom: '4px'
                                                    }}>
                                                        ⭐ {repo.name}
                                                    </div>
                                                    
                                                    <div style={{ 
                                                        fontSize: '12px', 
                                                        color: 'var(--panelkit-text-muted)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        {repo.language && (
                                                            <>
                                                                <span style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: 'var(--panelkit-text-muted)'
                                                                }}></span>
                                                                {repo.language}
                                                            </>
                                                        )}
                                                    </div>
                                                    
                                                    {notes[repo.full_name] && (
                                                        <div style={{ 
                                                            fontSize: '11px', 
                                                            color: 'var(--panelkit-text-muted)',
                                                            marginTop: '4px',
                                                            opacity: 0.7
                                                        }}>
                                                            {notes[repo.full_name].split('\n')[0].substring(0, 30)}...
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Main note editor */}
                                    <div style={{ 
                                        flex: 1, 
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        {activeNoteTab && (
                                            <>
                                                {/* Header */}
                                                <div style={{ 
                                                    padding: '16px 20px',
                                                    borderBottom: '1px solid var(--panelkit-border)',
                                                    backgroundColor: 'var(--panelkit-bg)'
                                                }}>
                                                    <div style={{ 
                                                        fontSize: '16px', 
                                                        fontWeight: '600',
                                                        color: 'var(--panelkit-text)',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {starred.find(repo => repo.full_name === activeNoteTab)?.name}
                                                    </div>
                                                    
                                                    <a 
                                                        href={starred.find(repo => repo.full_name === activeNoteTab)?.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ 
                                                            fontSize: '12px',
                                                            color: 'var(--panelkit-accent)',
                                                            textDecoration: 'none'
                                                        }}
                                                    >
                                                        View Repository →
                                                    </a>
                                                </div>

                                                {/* Note content */}
                                                <div style={{ 
                                                    flex: 1,
                                                    display: 'flex',
                                                    flexDirection: 'column'
                                                }}>
                                                    {/* Toolbar */}
                                                    <div style={{ 
                                                        padding: '8px 20px',
                                                        borderBottom: '1px solid var(--panelkit-border)',
                                                        backgroundColor: 'var(--panelkit-bg-secondary, rgba(0,0,0,0.01))',
                                                        fontSize: '11px',
                                                        color: 'var(--panelkit-text-muted)'
                                                    }}>
                                                        <strong>Formatting tips:</strong> Use <code>- [ ]</code> for checkboxes, <code>• </code> or <code>- </code> for bullets, <code># </code> for headers
                                                    </div>

                                                    {/* Split view: Editor and Preview */}
                                                    <div style={{ 
                                                        flex: 1,
                                                        display: 'flex'
                                                    }}>
                                                        {/* Editor */}
                                                        <div style={{ flex: 1 }}>
                                                            <textarea
                                                                placeholder="Start typing your notes...

                                                                    Examples:
                                                                    # Project Overview
                                                                    This is a header

                                                                    ## Tasks
                                                                    - [ ] Review the code
                                                                    - [x] Add documentation  
                                                                    - [ ] Test the feature

                                                                    ## Notes
                                                                    • Important point here
                                                                    • Another bullet point
                                                                    • Final notes"
                                                                value={notes[activeNoteTab] || ''}
                                                                onChange={(e) => handleNoteChange(activeNoteTab, e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    backgroundColor: 'var(--panelkit-bg)',
                                                                    color: 'var(--panelkit-text)',
                                                                    border: 'none',
                                                                    padding: '20px',
                                                                    fontSize: '14px',
                                                                    lineHeight: '1.5',
                                                                    fontFamily: 'SF Mono, Monaco, Inconsolata, "Roboto Mono", Consolas, "Courier New", monospace',
                                                                    resize: 'none',
                                                                    outline: 'none'
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Preview */}
                                                        {notes[activeNoteTab] && (
                                                            <div style={{ 
                                                                flex: 1,
                                                                borderLeft: '1px solid var(--panelkit-border)',
                                                                backgroundColor: 'var(--panelkit-bg-secondary, rgba(0,0,0,0.005))'
                                                            }}>
                                                                <div style={{ 
                                                                    padding: '8px 20px',
                                                                    borderBottom: '1px solid var(--panelkit-border)',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500',
                                                                    color: 'var(--panelkit-text-muted)'
                                                                }}>
                                                                    Preview
                                                                </div>
                                                                <div style={{ 
                                                                    padding: '20px',
                                                                    fontSize: '14px',
                                                                    lineHeight: '1.5',
                                                                    color: 'var(--panelkit-text)',
                                                                    overflowY: 'auto',
                                                                    height: 'calc(100% - 45px)'
                                                                }}>
                                                                    {formatNote(notes[activeNoteTab])}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}