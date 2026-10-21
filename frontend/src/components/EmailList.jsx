import React, { useRef, useEffect } from 'react';
import { Search, X, Inbox } from 'lucide-react';
import EmailRow from './EmailRow';
import SkeletonLoader from './SkeletonLoader';

export default function EmailList({
  emails,
  selectedEmailId,
  onSelectEmail,
  searchQuery,
  onSearchChange,
  activeQueue,
  isLoading
}) {
  const selectedRowRef = useRef(null);

  // Auto-scroll selected email into view on keyboard navigation
  useEffect(() => {
    if (selectedEmailId) {
      const el = document.getElementById(`email-row-${selectedEmailId}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedEmailId]);

  const getEmptyMessage = () => {
    if (searchQuery.trim()) {
      return `No emails match "${searchQuery}"`;
    }
    switch (activeQueue) {
      case 'review':
        return 'No emails need review';
      case 'sent':
        return 'No sent emails yet';
      case 'spam':
        return 'No spam intercepted';
      case 'all':
      default:
        return 'No emails found';
    }
  };

  return (
    <section className="email-list-pane" aria-label="Email list">
      {/* Top Search Header */}
      <div className="list-header">
        <div className="search-box">
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            id="input-search-emails"
            type="text"
            className="search-input"
            placeholder="Search subject, sender, body..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Subheader with Count */}
      <div className="list-subheader">
        <span style={{ textTransform: 'capitalize' }}>
          {activeQueue === 'review' ? 'Needs review' : activeQueue}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          {emails.length} {emails.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Email Rows / Skeletons / Empty State */}
      {isLoading ? (
        <SkeletonLoader rows={7} />
      ) : emails.length === 0 ? (
        <div className="empty-state-view">
          <Inbox size={28} style={{ opacity: 0.5 }} />
          <div className="empty-state-title">{getEmptyMessage()}</div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {activeQueue === 'review'
              ? 'All incoming inquiries and escalations have been processed.'
              : 'Incoming emails will be processed autonomously.'}
          </span>
        </div>
      ) : (
        <div className="email-rows-container" role="listbox">
          {emails.map((email) => (
            <EmailRow
              key={email.email_id}
              email={email}
              isSelected={email.email_id === selectedEmailId}
              onSelect={onSelectEmail}
            />
          ))}
        </div>
      )}
    </section>
  );
}
