// lib/github-api.js
const axios = require('axios');

class GitHubAPI {
    constructor(token) {
        this.token = token.replace('token ', ''); // Remove 'token ' prefix if present
        this.client = axios.create({
            baseURL: 'https://api.github.com',
            headers: {
                'Authorization': `token ${this.token}`,
                'Accept': 'application/vnd.github+json',
                'User-Agent': 'GitHub-Panel-Kit'
            }
        });
    }

    // Get user information
    async getUserInfo() {
        try {
            const response = await this.client.get('/user');
            return response.data;
        } catch (error) {
            console.error('Error fetching user info:', error.response?.data || error.message);
            throw error;
        }
    }

    // List user repositories
    async listRepos() {
        try {
            const response = await this.client.get('/user/repos', {
                params: {
                    sort: 'updated',
                    per_page: 100
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching repositories:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get starred repositories
    async getStarredRepos() {
        try {
            const response = await this.client.get('/user/starred', {
                params: {
                    per_page: 100
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching starred repos:', error.response?.data || error.message);
            throw error;
        }
    }

    async starRepo(fullName) {
        try {
            await this.client.put(`/user/starred/${fullName}`, null, {
                headers: { 'Content-Length': '0' }
            });
        } catch (error) {
            console.error('Error starring repo:', error.response?.data || error.message);
            throw error;
        }
    }

    async unstarRepo(fullName) {
        try {
            await this.client.delete(`/user/starred/${fullName}`);
        } catch (error) {
            console.error('Error unstarring repo:', error.response?.data || error.message);
            throw error;
        }
    }

    // Toggle star on repository
    async toggleStar(repoFullName, action) {
        try {
            const method = action === 'star' ? 'PUT' : 'DELETE';
            await this.client.request({
                method,
                url: `/user/starred/${repoFullName}`
            });
            return true;
        } catch (error) {
            console.error('Error toggling star:', error.response?.data || error.message);
            throw error;
        }
    }

    // Create issue
    async createIssue(repoFullName, title, body) {
        try {
            const response = await this.client.post(`/repos/${repoFullName}/issues`, {
                title,
                body
            });
            return response.data;
        } catch (error) {
            console.error('Error creating issue:', error.response?.data || error.message);
            throw error;
        }
    }

    // Update issue
    async updateIssue(repoFullName, issueNumber, title, body) {
        try {
            const response = await this.client.patch(`/repos/${repoFullName}/issues/${issueNumber}`, {
                title,
                body
            });
            return response.data;
        } catch (error) {
            console.error('Error updating issue:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get commits chart data
    async getCommitsChart() {
        try {
            const repos = await this.listRepos();
            const chartData = [];

            // Get commits for each repository (limited to prevent API rate limits)
            const topRepos = repos.slice(0, 10); // Limit to top 10 repos
            
            for (const repo of topRepos) {
                try {
                    const response = await this.client.get(`/repos/${repo.full_name}/commits`, {
                        params: {
                            per_page: 100,
                            since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
                        }
                    });
                    
                    chartData.push({
                        name: repo.name,
                        commits: response.data.length
                    });
                } catch (error) {
                    console.error(`Error fetching commits for ${repo.name}:`, error.message);
                    chartData.push({
                        name: repo.name,
                        commits: 0
                    });
                }
            }

            return chartData;
        } catch (error) {
            console.error('Error fetching commits chart data:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get repository issues
    async getRepoIssues(repoFullName) {
        try {
            const response = await this.client.get(`/repos/${repoFullName}/issues`, {
                params: {
                    state: 'all',
                    per_page: 100
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching issues:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get repository pull requests
    async getRepoPullRequests(repoFullName) {
        try {
            const response = await this.client.get(`/repos/${repoFullName}/pulls`, {
                params: {
                    state: 'all',
                    per_page: 100
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching pull requests:', error.response?.data || error.message);
            throw error;
        }
    }

    // Get repository contributors
    async getRepoContributors(repoFullName) {
        try {
            const response = await this.client.get(`/repos/${repoFullName}/contributors`, {
                params: {
                    per_page: 100
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching contributors:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = GitHubAPI;