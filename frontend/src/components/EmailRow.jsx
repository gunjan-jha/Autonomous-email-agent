import React from 'react';

function formatCompactTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.slice(0, 5);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function EmailRow({ email, isSelected, onSelect }) {
  // Determine status dot class
  const isPending =
    !email.is_spam &&
    (!email.human_decision || email.human_decision.trim() === '') &&
    (email.send_status === 'pending_approval' ||
      Boolean(email.requires_approval) ||
      Boolean(email.verification?.requires_human));

  let statusClass = 'neutral';
  if (email.is_spam) {
    statusClass = 'spam';
  } else if (isPending) {
    statusClass = 'pending';
  } else if (
    email.human_decision === 'approved' ||
    email.send_status === 'sent' ||
    email.send_status === 'approved_for_sending' ||
    email.send_status === 'dry_run_success'
  ) {
    statusClass = 'approved';
  } else if (email.human_decision === 'rejected') {
    statusClass = 'rejected';
  }

  // Priority tag class
  const priorityStr = (email.priority || '').toLowerCase();
  let priorityClass = '';
  if (priorityStr.includes('high') || priorityStr.includes('urgent')) {
    priorityClass = 'tag-priority-high';
  } else if (priorityStr.includes('medium')) {
    priorityClass = 'tag-priority-medium';
  } else if (priorityStr.includes('low')) {
    priorityClass = 'tag-priority-low';
  }

  const timeFormatted = formatCompactTime(email.created_at || email.updated_at);

  return (
    <div
      id={`email-row-${email.email_id}`}
      className={`email-row ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(email.email_id)}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(email.email_id);
        }
      }}
    >
      {/* Line 1: Status Dot + Sender + Monospace Time */}
      <div className="email-row-line-1">
        <div className="email-row-sender-group">
          <span className={`status-dot ${statusClass}`} title={`Status: ${statusClass}`} />
          <span className="email-row-sender" title={email.sender}>
            {email.sender || 'Unknown Sender'}
          </span>
        </div>
        <span className="email-row-time">{timeFormatted}</span>
      </div>

      {/* Line 2: Subject (Single line ellipsis, dense) */}
      <div className="email-row-line-2" title={email.subject}>
        {email.subject || '(No Subject)'}
      </div>

      {/* Line 3: Small flat tags (Category & Priority) */}
      <div className="email-row-line-3">
        {email.category && (
          <span className="tag" title={`Category: ${email.category}`}>
            {email.category}
          </span>
        )}
        {email.priority && (
          <span className={`tag ${priorityClass}`} title={`Priority: ${email.priority}`}>
            {email.priority}
          </span>
        )}
        {email.is_spam && (
          <span className="tag tag-danger" title="Flagged as spam">
            Spam
          </span>
        )}
      </div>
    </div>
  );
}
