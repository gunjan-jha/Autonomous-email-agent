import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Send,
  Tag
} from 'lucide-react';

export default function AgentTimeline({ email }) {
  if (!email) return null;

  // 1. Classification Step
  const isClassified = Boolean(email.category || email.priority || email.risk_level);
  
  // 2. Spam Check Step
  const spamChecked = true;
  const isSpam = Boolean(email.is_spam);

  // 3. Draft Generation Step
  const draftGenerated = Boolean(email.draft);

  // 4. Safety Verification Step
  const verification = email.verification || {};
  const isVerifiedSafe = verification.approved === true;
  const requiresHuman = verification.requires_human === true || email.requires_approval;

  // 5. Send Status Step
  const isApproved =
    email.human_decision === 'approved' ||
    email.send_status === 'sent' ||
    email.send_status === 'approved_for_sending' ||
    email.send_status === 'dry_run_success';
  const isRejected = email.human_decision === 'rejected';
  const isPendingApproval =
    !email.is_spam &&
    (!email.human_decision || email.human_decision.trim() === '') &&
    (email.send_status === 'pending_approval' ||
      Boolean(email.requires_approval) ||
      Boolean(email.verification?.requires_human));

  return (
    <div className="agent-steps-card">
      <div className="agent-steps-header">
        <span>Agent Execution Steps</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          LangGraph Workflow
        </span>
      </div>

      <div className="agent-timeline">
        {/* Step 1: Classified */}
        <div className="timeline-step">
          <div className={`step-icon-wrap ${isClassified ? 'done' : 'pending'}`}>
            {isClassified ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          </div>
          <div className="step-content">
            <div className="step-title-line">
              <span>Email Classification</span>
              {email.category && (
                <span className="tag" style={{ textTransform: 'capitalize' }}>
                  {email.category}
                </span>
              )}
              {email.priority && (
                <span className={`tag ${
                  email.priority.toLowerCase().includes('high') ? 'tag-priority-high' :
                  email.priority.toLowerCase().includes('medium') ? 'tag-priority-medium' : 'tag-priority-low'
                }`}>
                  {email.priority}
                </span>
              )}
              {email.risk_level && (
                <span className={`tag ${
                  email.risk_level.toLowerCase().includes('high') ? 'tag-danger' :
                  email.risk_level.toLowerCase().includes('medium') ? 'tag-warning' : 'tag-success'
                }`}>
                  Risk: {email.risk_level}
                </span>
              )}
            </div>
            <div className="step-description">
              Extracted intent, urgency, and sentiment via LLM classification.
            </div>
          </div>
        </div>

        {/* Step 2: Spam Check */}
        <div className="timeline-step">
          <div className={`step-icon-wrap ${isSpam ? 'blocked' : 'done'}`}>
            {isSpam ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
          </div>
          <div className="step-content">
            <div className="step-title-line">
              <span>Spam & Fraud Filter</span>
              {isSpam ? (
                <span className="tag tag-danger">Blocked</span>
              ) : (
                <span className="tag tag-success">Clean</span>
              )}
            </div>
            <div className="step-description">
              {isSpam ? 'Identified as suspicious / spam inbound message.' : 'Passed inbound heuristic and LLM spam check.'}
            </div>

            {/* Spam reason shown in full, never truncated */}
            {isSpam && email.spam_reason && (
              <div className="spam-reason-banner" style={{ marginTop: '6px' }}>
                <div className="spam-reason-header">
                  <ShieldAlert size={13} />
                  <span>Spam Detection Analysis</span>
                </div>
                <div className="spam-reason-text">{email.spam_reason}</div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Draft Generated */}
        <div className="timeline-step">
          <div className={`step-icon-wrap ${isSpam ? 'blocked' : draftGenerated ? 'done' : 'pending'}`}>
            {isSpam ? <XCircle size={11} /> : draftGenerated ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          </div>
          <div className="step-content">
            <div className="step-title-line">
              <span>AI Response Draft</span>
              {isSpam ? (
                <span className="tag tag-priority-low">Skipped</span>
              ) : draftGenerated ? (
                <span className="tag tag-success">Generated</span>
              ) : (
                <span className="tag">Pending</span>
              )}
            </div>
            <div className="step-description">
              {isSpam
                ? 'Response generation aborted because email was flagged as spam.'
                : draftGenerated
                ? 'Contextual reply synthesized using knowledge base and customer history.'
                : 'Generating draft response...'}
            </div>
          </div>
        </div>

        {/* Step 4: Safety Verification */}
        <div className="timeline-step">
          <div className={`step-icon-wrap ${
            isSpam ? 'blocked' :
            requiresHuman ? 'pending' :
            isVerifiedSafe ? 'done' : 'pending'
          }`}>
            {isSpam ? <XCircle size={11} /> : requiresHuman ? <Clock size={11} /> : isVerifiedSafe ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          </div>
          <div className="step-content">
            <div className="step-title-line">
              <span>Safety & Policy Verification</span>
              {isSpam ? (
                <span className="tag tag-danger">N/A</span>
              ) : requiresHuman ? (
                <span className="tag tag-warning">Human Approval Required</span>
              ) : isVerifiedSafe ? (
                <span className="tag tag-success">Passed</span>
              ) : (
                <span className="tag">In Progress</span>
              )}
            </div>
            <div className="step-description">
              {verification.reason || (
                requiresHuman
                  ? 'Flagged for human oversight (sensitive customer request or refund inquiry).'
                  : 'Safety verification evaluated reply tone, factual claims, and compliance.'
              )}
            </div>
          </div>
        </div>

        {/* Step 5: Send Status */}
        <div className="timeline-step">
          <div className={`step-icon-wrap ${
            isSpam ? 'blocked' :
            isApproved ? 'done' :
            isRejected ? 'blocked' :
            isPendingApproval ? 'pending' : 'pending'
          }`}>
            {isSpam || isRejected ? <XCircle size={11} /> : isApproved ? <CheckCircle2 size={11} /> : <Clock size={11} />}
          </div>
          <div className="step-content">
            <div className="step-title-line">
              <span>Outbound Send Status</span>
              {isSpam ? (
                <span className="tag tag-danger">Halted</span>
              ) : isApproved ? (
                <span className="tag tag-success">Sent / Dispatched</span>
              ) : isRejected ? (
                <span className="tag tag-danger">Rejected</span>
              ) : isPendingApproval ? (
                <span className="tag tag-warning">Paused</span>
              ) : (
                <span className="tag">{email.send_status || 'Pending'}</span>
              )}
            </div>
            <div className="step-description">
              {isSpam
                ? 'No outbound message sent.'
                : isApproved
                ? `Reply dispatched to ${email.sender}.`
                : isRejected
                ? `Response was rejected by operator${email.human_feedback ? `: "${email.human_feedback}"` : '.'}`
                : isPendingApproval
                ? 'Workflow paused at LangGraph checkpoint awaiting human review.'
                : 'Pending send action.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
