import React from 'react';
import { Check, X, Edit3, RotateCcw, AlertTriangle, ShieldOff } from 'lucide-react';

export default function ActionBar({
  email,
  isEditingDraft,
  onToggleEditDraft,
  onApprove,
  onReject,
  onRestoreSpam,
  isSubmitting
}) {
  if (!email) return null;

  const isPendingApproval =
    !email.is_spam &&
    (!email.human_decision || email.human_decision.trim() === '') &&
    (email.send_status === 'pending_approval' ||
      Boolean(email.requires_approval) ||
      Boolean(email.verification?.requires_human));

  // Case 1: Spam email -> "Not spam, restore" button
  if (email.is_spam) {
    return (
      <div className="action-bar" role="toolbar" aria-label="Spam action bar">
        <div className="action-bar-left">
          <span style={{ fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={13} />
            Flagged as spam by automated safety filters
          </span>
        </div>
        <div className="action-bar-right">
          {/* 
            TODO (Backend): Implement backend endpoint to restore an email incorrectly flagged as spam.
            Suggested endpoint: POST /emails/{email_id}/unmark-spam or /emails/{email_id}/restore
            Currently, there is no backend route for restoring spam.
          */}
          <button
            id="btn-restore-spam"
            className="btn btn-sm"
            onClick={onRestoreSpam}
            title="Restore this email to inbox and trigger drafting (Backend endpoint pending)"
          >
            <ShieldOff size={13} />
            <span>Not spam, restore</span>
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Needs human approval -> [Approve & send] [Edit draft] [Reject]
  if (isPendingApproval) {
    return (
      <div className="action-bar" role="toolbar" aria-label="Approval action bar">
        <div className="action-bar-left">
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Review required before dispatch
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            • <kbd className="shortcut-hint">J</kbd>/<kbd className="shortcut-hint">K</kbd> to move
          </span>
        </div>

        <div className="action-bar-right">
          {/* Reject button */}
          <button
            id="btn-reject-draft"
            className="btn btn-danger btn-sm"
            onClick={onReject}
            disabled={isSubmitting}
            title="Reject draft and prevent reply from being sent (R)"
          >
            <X size={12} />
            <span>Reject</span>
            <kbd className="shortcut-hint">R</kbd>
          </button>

          {/* Edit draft button */}
          <button
            id="btn-edit-draft"
            className={`btn btn-sm ${isEditingDraft ? 'btn-primary' : ''}`}
            onClick={onToggleEditDraft}
            disabled={isSubmitting}
            title="Toggle draft editing in textarea (E)"
          >
            <Edit3 size={12} />
            <span>{isEditingDraft ? 'Done Editing' : 'Edit draft'}</span>
            <kbd className="shortcut-hint">E</kbd>
          </button>

          {/* Approve & send button */}
          <button
            id="btn-approve-send"
            className="btn btn-success btn-sm"
            onClick={onApprove}
            disabled={isSubmitting}
            title="Approve draft and dispatch to recipient (A)"
          >
            <Check size={12} />
            <span>Approve & send</span>
            <kbd className="shortcut-hint">A</kbd>
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Already approved / sent or rejected
  return null;
}
