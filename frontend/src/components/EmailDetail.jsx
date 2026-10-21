import React from 'react';
import { Mail, Sparkles, Copy, ArrowLeft } from 'lucide-react';
import AgentTimeline from './AgentTimeline';
import ActionBar from './ActionBar';

export default function EmailDetail({
  email,
  isEditingDraft,
  editedDraft,
  onDraftChange,
  onToggleEditDraft,
  onApprove,
  onReject,
  onRestoreSpam,
  isSubmitting,
  onCopyText,
  onMobileBack
}) {
  if (!email) {
    return (
      <section className="detail-pane" aria-label="Email detail empty">
        <div className="empty-state-view">
          <Mail size={32} style={{ opacity: 0.3 }} />
          <div className="empty-state-title">No email selected</div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Select an email from the list or use <kbd className="shortcut-hint">J</kbd> / <kbd className="shortcut-hint">K</kbd> to navigate
          </span>
        </div>
      </section>
    );
  }

  const formatFullTimestamp = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return dateStr;
    }
  };

  const showDraftColumn = !email.is_spam;

  return (
    <section
      className={`detail-pane ${email ? 'mobile-open' : ''}`}
      aria-label="Email detail pane"
    >
      {/* Detail Header: Subject, Mobile Back button, and Monospace Message ID */}
      <div className="detail-header">
        <div className="detail-header-left">
          {onMobileBack && (
            <button
              className="btn btn-sm"
              onClick={onMobileBack}
              title="Back to list"
              style={{ marginRight: '4px' }}
            >
              <ArrowLeft size={13} />
            </button>
          )}
          <h2 className="detail-header-subject" title={email.subject}>
            {email.subject || '(No Subject)'}
          </h2>
        </div>
        <div className="detail-header-right">
          <span className="meta-id-mono" title={`Message ID: ${email.email_id}`}>
            {email.email_id}
          </span>
        </div>
      </div>

      {/* Meta Bar: Sender, Recipient, and Monospace Timestamp */}
      <div className="detail-meta-bar">
        <div className="meta-contacts">
          <span className="meta-contact-item">
            From: <strong>{email.sender || 'Unknown'}</strong>
          </span>
          {email.recipient && (
            <span className="meta-contact-item">
              To: <strong>{email.recipient}</strong>
            </span>
          )}
        </div>
        <span className="meta-id-mono">
          {formatFullTimestamp(email.created_at || email.updated_at)}
        </span>
      </div>

      {/* Scrollable Content Body */}
      <div className="detail-content-scroll">
        {/* Two Columns Side-by-Side: Original Email and AI Draft */}
        <div className={`side-by-side-grid ${!showDraftColumn ? 'single-col' : ''}`}>
          {/* Column 1: Original Inbound Email */}
          <div className="pane-box">
            <div className="pane-box-header">
              <div className="pane-box-header-title">
                <Mail size={13} />
                <span>Original Inbound Email</span>
              </div>
              <button
                className="btn btn-sm"
                onClick={() => onCopyText(email.body, 'Original email body')}
                title="Copy original message body"
              >
                <Copy size={11} />
                <span>Copy</span>
              </button>
            </div>
            <div className="pane-box-body">
              {email.body || '(Empty body)'}
            </div>
          </div>

          {/* Column 2: AI Draft (editable textarea or rendered preview) */}
          {showDraftColumn && (
            <div className="pane-box">
              <div className="pane-box-header">
                <div className="pane-box-header-title">
                  <Sparkles size={13} />
                  <span>AI Generated Draft</span>
                  {isEditingDraft && <span className="tag tag-warning">Editing</span>}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="btn btn-sm"
                    onClick={() =>
                      onCopyText(
                        isEditingDraft ? editedDraft : email.draft,
                        'Draft response'
                      )
                    }
                    title="Copy AI draft text"
                  >
                    <Copy size={11} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {isEditingDraft ? (
                <textarea
                  id="textarea-draft-editor"
                  className="draft-textarea"
                  value={editedDraft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  placeholder="Edit response draft..."
                  aria-label="Editable draft response"
                  autoFocus
                />
              ) : (
                <div className="pane-box-body" style={{ minHeight: '200px' }}>
                  {editedDraft || email.draft || '(No draft available)'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vertical Agent Steps Timeline */}
        <AgentTimeline email={email} />
      </div>

      {/* Sticky Bottom Action Bar */}
      <ActionBar
        email={email}
        isEditingDraft={isEditingDraft}
        onToggleEditDraft={onToggleEditDraft}
        onApprove={onApprove}
        onReject={onReject}
        onRestoreSpam={onRestoreSpam}
        isSubmitting={isSubmitting}
      />
    </section>
  );
}
