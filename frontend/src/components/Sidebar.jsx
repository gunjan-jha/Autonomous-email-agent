import React from 'react';
import {
  Inbox,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Sun,
  Moon,
  RefreshCw,
  Sparkles,
  Shield,
  Tag,
  Layers,
  ArrowLeft,
  Mail
} from 'lucide-react';

export default function Sidebar({
  activeQueue,
  onSelectQueue,
  selectedCategory,
  onSelectCategory,
  queueCounts,
  categories = ['all', 'sales', 'marketing', 'notification', 'complaint', 'inquiry'],
  theme,
  onToggleTheme,
  onPollInbox,
  isPolling,
  onTestEmail,
  onGoHome,
  connectedAccount,
  onDisconnect
}) {
  const queues = [
    { id: 'review', label: 'Needs review', icon: Clock, count: queueCounts.review, urgent: queueCounts.review > 0 },
    { id: 'sent', label: 'Sent', icon: CheckCircle2, count: queueCounts.sent },
    { id: 'spam', label: 'Spam', icon: ShieldAlert, count: queueCounts.spam, spam: queueCounts.spam > 0 },
    { id: 'all', label: 'All', icon: Inbox, count: queueCounts.all }
  ];

  return (
    <aside className="sidebar" aria-label="Sidebar navigation">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-badge">
          <div className="brand-icon-box">
            <Mail size={13} strokeWidth={2.5} />
          </div>
          <span>Mailroom</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onGoHome && (
            <button
              id="btn-go-home"
              className="theme-toggle-btn"
              onClick={onGoHome}
              title="Return to Home & Gmail Connection"
              aria-label="Home"
            >
              <ArrowLeft size={13} />
            </button>
          )}
          <button
            id="btn-toggle-theme"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {/* Queues Section */}
        <div className="nav-section">
          <div className="section-label">Queues</div>
          {queues.map(q => {
            const Icon = q.icon;
            const isActive = activeQueue === q.id;
            return (
              <button
                key={q.id}
                id={`queue-${q.id}`}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectQueue(q.id)}
              >
                <div className="nav-item-left">
                  <Icon size={14} />
                  <span>{q.label}</span>
                </div>
                <span className={`nav-badge ${q.urgent ? 'urgent' : ''} ${q.spam ? 'spam' : ''}`}>
                  {q.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Categories Filter Section */}
        <div className="nav-section">
          <div className="section-label">Categories</div>
          {categories.map(cat => {
            const isAll = cat === 'all';
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                id={`cat-${cat}`}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCategory(cat)}
              >
                <div className="nav-item-left">
                  {isAll ? <Layers size={13} /> : <Tag size={13} />}
                  <span style={{ textTransform: 'capitalize' }}>
                    {isAll ? 'All categories' : cat}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Footer Actions */}
      <div className="sidebar-footer">
        {connectedAccount && (
          <div
            className="sidebar-account-badge"
            style={{
              padding: '7px 9px',
              background: 'var(--surface-hover)',
              borderRadius: '4px',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '11px',
              marginBottom: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                Connected
              </span>
              {onDisconnect && (
                <button
                  id="btn-sidebar-disconnect"
                  onClick={() => onDisconnect(connectedAccount.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                  title="Disconnect account and return to home page"
                >
                  Disconnect
                </button>
              )}
            </div>
            <div
              style={{ fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={connectedAccount.account_email}
            >
              {connectedAccount.account_email}
            </div>
          </div>
        )}

        <button
          id="btn-poll-inbox"
          className="btn btn-sm"
          onClick={onPollInbox}
          disabled={isPolling}
          style={{ width: '100%', justifyContent: 'center' }}
          title="Poll Gmail inbox for new unread messages"
        >
          <RefreshCw size={12} className={isPolling ? 'spin' : ''} />
          <span>{isPolling ? 'Polling...' : 'Poll Inbox'}</span>
        </button>

        <button
          id="btn-test-inbound"
          className="btn btn-primary btn-sm"
          onClick={onTestEmail}
          style={{ width: '100%', justifyContent: 'center' }}
          title="Simulate inbound incoming email"
        >
          <Sparkles size={12} />
          <span>Test Inbound Email</span>
        </button>
      </div>
    </aside>
  );
}
