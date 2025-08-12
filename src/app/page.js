'use client';

import Link from 'next/link'

const apis = [
  { 
    name: 'GitHub Stats', 
    slug: 'github', 
    desc: 'View GitHub user data and repositories', 
    emoji: '💻',
    status: 'online',
    lastUpdated: '2 mins ago'
  },
  { 
    name: 'Weather', 
    slug: 'weather', 
    desc: 'Check weather conditions by city', 
    emoji: '🌦',
    status: 'online', 
    lastUpdated: '5 mins ago'
  },
  { 
    name: 'Crypto Prices', 
    slug: 'crypto', 
    desc: 'Live cryptocurrency market data', 
    emoji: '📈',
    status: 'warning',
    lastUpdated: '1 hour ago'
  },
]

const recentActivity = [
  { action: 'GitHub API called', time: '2 minutes ago', type: 'success' },
  { action: 'Weather data fetched', time: '5 minutes ago', type: 'info' },
  { action: 'Rate limit warning', time: '1 hour ago', type: 'warning' },
]

export default function Home() {
  return (
    <div className="panelkit-container">
      {/* Sidebar */}
      <div className="panelkit-sidebar">
        {/* Explorer Section */}
        <div className="sidebar-section">
          <div className="sidebar-header">
            📁 Explorer
          </div>
          <div>
            <div className="sidebar-item">
              <span>📄</span> package.json
            </div>
            <div className="sidebar-item">
              <span>📄</span> next.config.js
            </div>
            <div className="sidebar-item active">
              <span>📄</span> page.js
            </div>
            <div className="sidebar-item">
              <span>📁</span> components/
            </div>
            <div className="sidebar-item">
              <span>📁</span> api/
            </div>
          </div>
        </div>

        {/* APIs Section */}
        <div className="sidebar-section">
          <div className="sidebar-header">
            🔌 Available APIs
          </div>
          <div>
            {apis.map(api => (
              <Link key={api.slug} href={`/${api.slug}`}>
                <div className="sidebar-item">
                  <span className={`status-indicator status-${api.status}`}></span>
                  <span>{api.emoji}</span>
                  <span>{api.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Section */}
        <div className="sidebar-section">
          <div className="sidebar-header">
            📊 Recent Activity
          </div>
          <div>
            {recentActivity.map((activity, index) => (
              <div key={index} className="sidebar-item">
                <span className={`status-indicator status-${activity.type === 'success' ? 'online' : activity.type === 'warning' ? 'warning' : 'offline'}`}></span>
                <div>
                  <div style={{ fontSize: '12px' }}>{activity.action}</div>
                  <div style={{ fontSize: '10px', color: 'var(--panelkit-text-muted)' }}>{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="panelkit-main">
        {/* Tabs */}
        <div className="panelkit-tabs">
          <div className="panelkit-tab active">
            <span>📄</span>
            <span>Welcome</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="panelkit-content">
          <div style={{ maxWidth: '800px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: '600', 
                marginBottom: '8px',
                color: 'var(--panelkit-text)'
              }}>
                🌐 PanelKit
              </h1>
              <p style={{ 
                fontSize: '16px', 
                color: 'var(--panelkit-text-muted)',
                marginBottom: '24px'
              }}>
                Not just a dashboard — PanelKit is my API learning lab, now open for everyone.
              </p>
              
              {/* Status Bar */}
              <div className="code-block" style={{ marginBottom: '24px' }}>
                <div style={{ color: '#4caf50' }}>✓ System Status: All services operational</div>
                <div style={{ color: 'var(--panelkit-text-muted)', fontSize: '12px', marginTop: '4px' }}>
                  Last checked: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* API Grid */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: 'var(--panelkit-text)'
              }}>
                Available Services
              </h2>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '16px' 
              }}>
                {apis.map(api => (
                  <Link key={api.slug} href={`/${api.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="panelkit-card" style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      ':hover': {
                        borderColor: 'var(--panelkit-accent)'
                      }
                    }}
                    onMouseEnter={(e) => e.target.style.borderColor = 'var(--panelkit-accent)'}
                    onMouseLeave={(e) => e.target.style.borderColor = 'var(--panelkit-border)'}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        marginBottom: '12px'
                      }}>
                        <span style={{ fontSize: '24px' }}>{api.emoji}</span>
                        <div>
                          <h3 style={{ 
                            fontSize: '16px', 
                            fontWeight: '600',
                            color: 'var(--panelkit-text)',
                            marginBottom: '4px'
                          }}>
                            {api.name}
                          </h3>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px' 
                          }}>
                            <span className={`status-indicator status-${api.status}`}></span>
                            <span style={{ 
                              fontSize: '12px', 
                              color: 'var(--panelkit-text-muted)' 
                            }}>
                              {api.status === 'online' ? 'Online' : api.status === 'warning' ? 'Warning' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p style={{ 
                        fontSize: '14px', 
                        color: 'var(--panelkit-text-muted)',
                        marginBottom: '12px',
                        lineHeight: '1.4'
                      }}>
                        {api.desc}
                      </p>
                      
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--panelkit-text-muted)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>Last updated: {api.lastUpdated}</span>
                        <span style={{ color: 'var(--panelkit-accent)' }}>Open →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: 'var(--panelkit-text)'
              }}>
                Quick Actions
              </h2>
              
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                flexWrap: 'wrap' 
              }}>
                <button className="panelkit-button">
                  📊 View Analytics
                </button>
                <button className="panelkit-button secondary">
                  ⚙️ Settings
                </button>
                <button className="panelkit-button secondary">
                  📚 Documentation
                </button>
                <button className="panelkit-button secondary">
                  🔄 Refresh All
                </button>
              </div>
            </div>

            {/* Footer Info */}
            <div style={{ 
              marginTop: '48px', 
              padding: '16px 0', 
              borderTop: '1px solid var(--panelkit-border)',
              fontSize: '12px',
              color: 'var(--panelkit-text-muted)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>PanelKit v1.0.0</span>
                <span>Node.js {process.version || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}