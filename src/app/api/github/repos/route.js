// api/github/repos/route.js - Updated to use your deployed backend
const express = require('express');
const GitHubAPI = require('../github-api'); // Import the class we created
const router = express.Router();

// Middleware to check token
const requireToken = (req, res, next) => {
    const token = req.headers.authorization || req.body.token || req.query.token;
    if (!token) {
        return res.status(401).json({ error: 'GitHub token required' });
    }
    req.githubToken = token;
    next();
};

// Get user repositories (uses your deployed backend)
router.get('/', requireToken, async (req, res) => {
    try {
        const api = new GitHubAPI(req.githubToken);
        const repos = await api.listRepos();
        res.json(repos);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch repositories' });
    }
});

// Create issue (uses your deployed backend)
router.post('/issue', requireToken, async (req, res) => {
    try {
        const { repo, title, body } = req.body;
        const api = new GitHubAPI(req.githubToken);
        const issue = await api.createIssue(repo, title, body);
        res.json(issue);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create issue' });
    }
});

// Get user info
router.get('/user', requireToken, async (req, res) => {
    try {
        const api = new GitHubAPI(req.githubToken);
        const user = await api.getUserInfo();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user info' });
    }
});

// Get starred repositories
router.get('/starred', requireToken, async (req, res) => {
    try {
        const api = new GitHubAPI(req.githubToken);
        const starred = await api.getStarredRepos();
        res.json(starred);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch starred repos' });
    }
});

// Toggle star on repository
router.put('/star/:owner/:repo', requireToken, async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const { action } = req.body; // 'star' or 'unstar'
        
        const api = new GitHubAPI(req.githubToken);
        const result = await api.toggleStar(`${owner}/${repo}`, action);
        res.json({ success: result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle star' });
    }
});

// Update issue
router.patch('/issue/:owner/:repo/:number', requireToken, async (req, res) => {
    try {
        const { owner, repo, number } = req.params;
        const { title, body } = req.body;
        
        const api = new GitHubAPI(req.githubToken);
        const issue = await api.updateIssue(`${owner}/${repo}`, number, title, body);
        res.json(issue);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update issue' });
    }
});

// Get commits chart data
router.get('/commits-chart', requireToken, async (req, res) => {
    try {
        const api = new GitHubAPI(req.githubToken);
        const chartData = await api.getCommitsChart();
        
        res.json({
            labels: chartData.map(item => item.name),
            data: chartData.map(item => item.commits)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch commits chart data' });
    }
});

module.exports = router;