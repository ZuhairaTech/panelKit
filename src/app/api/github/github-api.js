// api/github/github-api.js - Reuse your deployed backend
const fetch = require('node-fetch'); // or use axios

class GitHubAPI {
    constructor(token) {
        this.token = token;
        this.backendUrl = 'https://github-app-backend.vercel.app/api';
        this.githubUrl = 'https://api.github.com';
    }

    // Use your deployed backend endpoints
    async listRepos() {
        try {
            const response = await fetch(`${this.backendUrl}/list-repos`, {
                headers: { Authorization: `token ${this.token}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Error listing repos:', error);
            throw error;
        }
    }

    async createIssue(repo, title, body) {
        try {
            const response = await fetch(`${this.backendUrl}/create-issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `token ${this.token}`
                },
                body: JSON.stringify({ repo, title, body })
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating issue:', error);
            throw error;
        }
    }

    // Direct GitHub API calls for other features
    async getUserInfo() {
        try {
            const response = await fetch(`${this.githubUrl}/user`, {
                headers: { Authorization: `token ${this.token}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching user info:', error);
            throw error;
        }
    }

    async getStarredRepos() {
        try {
            const response = await fetch(`${this.githubUrl}/user/starred`, {
                headers: { Authorization: `token ${this.token}` }
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching starred repos:', error);
            throw error;
        }
    }

    async toggleStar(repoName, action = 'star') {
        try {
            const method = action === 'star' ? 'PUT' : 'DELETE';
            const response = await fetch(`${this.githubUrl}/user/starred/${repoName}`, {
                method: method,
                headers: { Authorization: `token ${this.token}` }
            });
            return response.status === 204;
        } catch (error) {
            console.error('Error toggling star:', error);
            throw error;
        }
    }

    async updateIssue(repo, issueNumber, title, body) {
        try {
            const response = await fetch(`${this.githubUrl}/repos/${repo}/issues/${issueNumber}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `token ${this.token}`
                },
                body: JSON.stringify({ title, body })
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating issue:', error);
            throw error;
        }
    }

    async getCommitsChart() {
        try {
            const repos = await this.listRepos();
            const commitPromises = repos.repositories.map(async repo => {
                const commitsResponse = await fetch(`${this.githubUrl}/repos/${repo.full_name}/commits?per_page=1`, {
                    headers: { Authorization: `token ${this.token}` }
                });
                
                const linkHeader = commitsResponse.headers.get('Link');
                let totalCommits = 0;

                if (linkHeader && linkHeader.includes('rel="last"')) {
                    const lastPageUrl = linkHeader.split(',').find(s => s.includes('rel="last"')).split(';')[0].trim().slice(1, -1);
                    const urlParams = new URLSearchParams(new URL(lastPageUrl).search);
                    totalCommits = parseInt(urlParams.get('page'));
                } else {
                    const commits = await commitsResponse.json();
                    totalCommits = commits.length;
                }

                return { name: repo.name, commits: totalCommits, pushed_at: repo.pushed_at };
            });

            const commitData = await Promise.all(commitPromises);
            return commitData.sort((a, b) => new Date(a.pushed_at) - new Date(b.pushed_at));
        } catch (error) {
            console.error('Error getting commits chart:', error);
            throw error;
        }
    }
}

module.exports = GitHubAPI;