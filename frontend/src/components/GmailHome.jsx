import React, { useState, useEffect } from 'react';
import {
  Mail,
  Shield,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Lock,
  Zap,
  Check,
  AlertTriangle,
  Play,
  RotateCw,
  Clock,
  Inbox,
  LogOut,
  Sliders,
  Send,
  HelpCircle,
  Sparkles,
  UserCheck,
  FileText
} from 'lucide-react';
import './GmailHome.css';

export default function GmailHome({
  apiBase = 'http://localhost:8000',
  onOpenConsole,
  onTriggerPoll,
  isPolling,
  onSimulateEmail,
  addToast,
  onNavigatePrivacy,
  onNavigateTerms,
}) {
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState(null);

  // Quick Simulation Form state on home page
  const [simSender, setSimSender] = useState('sarah.miller@acme-enterprises.com');
  const [simSubject, setSimSubject] = useState('Enterprise Tier Contract Renewal & Custom SLA Inquiry');
  const [simBody, setSimBody] = useState(
    'Hi team,\n\nWe are currently evaluating our annual contract renewal for 500 seats. Can you share the latest pricing tier for customized 99.99% SLAs and dedicated account management?\n\nBest,\nSarah Miller\nVP Operations, Acme'
  );
  const [isSimulatingLocal, setIsSimulatingLocal] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // Fetch connected accounts
  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const res = await fetch(`${apiBase}/integrations/gmail/accounts`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setConnectedAccounts(data || []);
      }
    } catch (err) {
      console.warn('Could not fetch Gmail accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();

    // Check if redirected with ?connected=true
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      if (addToast) addToast('Gmail account connected successfully! Welcome to Mailroom.', 'success');
      // Clean query parameter from address bar
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchAccounts();
      if (onOpenConsole) onOpenConsole();
    }
  }, [onOpenConsole]);

  const handleConnectGmail = () => {
    if (addToast) addToast('Redirecting to Google secure sign-in...', 'info');
    window.location.href = `${apiBase}/integrations/gmail/connect`;
  };

  const handleDisconnect = async (accountId, email) => {
    if (!window.confirm(`Are you sure you want to disconnect ${email}?`)) return;
    try {
      setDisconnectingId(accountId);
      const res = await fetch(`${apiBase}/integrations/gmail/accounts/${accountId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to disconnect');
      if (addToast) addToast(`Disconnected ${email}.`, 'info');
      await fetchAccounts();
    } catch (err) {
      if (addToast) addToast(`Failed to disconnect: ${err.message}`, 'error');
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleRunHomeSimulation = async (e) => {
    e.preventDefault();
    setIsSimulatingLocal(true);
    setSimResult(null);
    if (addToast) addToast('Analyzing incoming email and drafting response...', 'info');

    const emailId = `sim-home-${Date.now()}`;
    const payload = {
      email_id: emailId,
      thread_id: `thread-${Date.now()}`,
      sender: simSender,
      recipient: 'support@mailroom.app',
      subject: simSubject,
      body: simBody
    };

    try {
      const res = await fetch(`${apiBase}/emails/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Simulation failed');
      setSimResult(data);
      if (addToast) addToast('Draft created! Inspect the reply below.', 'success');
    } catch (err) {
      if (addToast) addToast(`Simulation error: ${err.message}`, 'error');
    } finally {
      setIsSimulatingLocal(false);
    }
  };

  const hasConnectedAccount = connectedAccounts.length > 0;
  const primaryAccount = connectedAccounts[0] || null;

  return (
    <div className="jotform-landing">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="jotform-nav" role="banner">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="brand-icon">
              <Mail size={18} strokeWidth={2.5} />
            </div>
            <div className="brand-meta">
              <span className="brand-name">Mailroom</span>
              <span className="brand-tag">Email Assistant</span>
            </div>
          </div>

          <nav className="nav-links" aria-label="Main Navigation">
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#benefits" className="nav-link">Benefits</a>
            <a href="#sandbox" className="nav-link">Live Demo</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </nav>

          <div className="nav-actions">
            {hasConnectedAccount ? (
              <>
                <button
                  id="btn-nav-poll"
                  className="btn-jotform-accent-sm"
                  onClick={onTriggerPoll}
                  disabled={isPolling}
                  title="Check Gmail for new incoming emails"
                >
                  <RotateCw size={14} className={isPolling ? 'spin-icon' : ''} />
                  <span>{isPolling ? 'Checking...' : 'Check Inbox'}</span>
                </button>
                <button
                  id="btn-nav-console"
                  className="btn-jotform-primary-sm"
                  onClick={onOpenConsole}
                >
                  <Inbox size={15} />
                  <span>Open Console</span>
                </button>
              </>
            ) : (
              <button
                id="btn-nav-connect"
                className="btn-jotform-primary-sm"
                onClick={handleConnectGmail}
              >
                <span>Connect Gmail</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="jotform-hero" aria-labelledby="hero-heading">
        <div className="hero-container">
          <div className="hero-grid">
            {/* Left: Copy & Primary CTAs */}
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-pill">SMART INBOX COPILOT</span>
                <span className="badge-sub">100% IN YOUR CONTROL</span>
              </div>

              <h1 id="hero-heading" className="hero-title">
                Write, Triage, and Reply to Emails in Seconds
              </h1>

              <p className="hero-lead">
                Never waste your mornings typing repetitive replies again. Mailroom automatically reads incoming customer emails, writes polite and accurate drafts, and asks for your one-click approval before sending. You stay in 100% control.
              </p>

              {/* Action Buttons */}
              <div className="hero-cta-group">
                {hasConnectedAccount ? (
                  <button
                    id="btn-hero-launch"
                    className="btn-jotform-primary-lg"
                    onClick={onOpenConsole}
                  >
                    <span>Launch Mailroom Console</span>
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    id="btn-hero-connect"
                    className="btn-jotform-primary-lg"
                    onClick={handleConnectGmail}
                  >
                    <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                      <path
                        fill="#FFFFFF"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#FFFFFF"
                        opacity="0.9"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FFFFFF"
                        opacity="0.8"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#FFFFFF"
                        opacity="0.95"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Connect with Gmail</span>
                  </button>
                )}

                <a
                  id="btn-hero-sandbox"
                  className="btn-jotform-secondary-lg"
                  href="#sandbox"
                >
                  <Play size={18} />
                  <span>Try Live Demo</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="hero-trust-bar">
                <div className="trust-item">
                  <CheckCircle2 size={16} className="trust-icon" />
                  <span>100% Human Approval on Replies</span>
                </div>
                <div className="trust-item">
                  <CheckCircle2 size={16} className="trust-icon" />
                  <span>Official Google Sign-In</span>
                </div>
                <div className="trust-item">
                  <CheckCircle2 size={16} className="trust-icon" />
                  <span>No Accidental Sends</span>
                </div>
              </div>
            </div>

            {/* Right: Live Gmail Connection Card */}
            <div className="hero-visual">
              <div className="jotform-card connection-card">
                <div className="card-header-bar">
                  <div className="header-status-indicator">
                    <span className={`status-dot ${hasConnectedAccount ? 'status-dot-active' : ''}`} />
                    <span className="status-label">
                      {hasConnectedAccount ? 'GMAIL INBOX ACTIVE' : 'CONNECT YOUR EMAIL'}
                    </span>
                  </div>
                  <span className="card-protocol-tag">Safe & Private</span>
                </div>

                <div className="card-body">
                  {loadingAccounts ? (
                    <div className="card-loading-state">
                      <RotateCw size={24} className="spin-icon text-muted" />
                      <p>Checking your connected email...</p>
                    </div>
                  ) : hasConnectedAccount ? (
                    <div className="account-connected-panel">
                      <div className="connected-badge-row">
                        <div className="avatar-chip">
                          <Mail size={16} />
                        </div>
                        <div className="account-details">
                          <span className="account-email">{primaryAccount.account_email}</span>
                          <span className="account-status-sub">
                            Connected via Google • Ready to draft replies
                          </span>
                        </div>
                      </div>

                      <div className="connected-stats-grid">
                        <div className="stat-box">
                          <span className="stat-num">Instant</span>
                          <span className="stat-label">Draft Replies</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-num">Active</span>
                          <span className="stat-label">Spam Blocker</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-num">1-Click</span>
                          <span className="stat-label">Approvals</span>
                        </div>
                      </div>

                      <div className="connected-card-actions">
                        <button
                          className="btn-jotform-accent"
                          onClick={onTriggerPoll}
                          disabled={isPolling}
                        >
                          <RotateCw size={16} className={isPolling ? 'spin-icon' : ''} />
                          <span>{isPolling ? 'Checking Inbox...' : 'Check for New Emails'}</span>
                        </button>
                        <button
                          className="btn-jotform-disconnect"
                          onClick={() => handleDisconnect(primaryAccount.id, primaryAccount.account_email)}
                          disabled={disconnectingId === primaryAccount.id}
                        >
                          <LogOut size={14} />
                          <span>Disconnect</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="account-connect-panel">
                      <div className="oauth-scope-overview">
                        <h3 className="scope-title">How Mailroom Helps You</h3>
                        <p className="scope-desc">
                          Connect your Gmail safely in one click. Mailroom works like a personal executive assistant for your inbox:
                        </p>

                        <div className="scope-list">
                          <div className="scope-item">
                            <span className="scope-check"><Check size={12} /></span>
                            <div className="scope-info">
                              <span className="scope-name">Reads incoming messages</span>
                              <span className="scope-detail">Understands questions, meeting requests, and inquiries</span>
                            </div>
                          </div>
                          <div className="scope-item">
                            <span className="scope-check"><Check size={12} /></span>
                            <div className="scope-info">
                              <span className="scope-name">Prepares polite draft replies</span>
                              <span className="scope-detail">Writes clear, friendly answers saved in your review queue</span>
                            </div>
                          </div>
                          <div className="scope-item">
                            <span className="scope-check"><Check size={12} /></span>
                            <div className="scope-info">
                              <span className="scope-name">Waits for your approval</span>
                              <span className="scope-detail">You review and approve with one click before anything is sent</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="encryption-guarantee">
                        <Lock size={14} className="lock-icon" />
                        <span>Official Google Sign-In. We never see or store your Google password.</span>
                      </div>

                      <button
                        id="btn-card-connect"
                        className="btn-jotform-primary w-full"
                        onClick={handleConnectGmail}
                      >
                        <span>Connect with Gmail</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (IN 3 SIMPLE STEPS) */}
      <section id="how-it-works" className="jotform-band band-neutral-4" aria-labelledby="section-how-heading">
        <div className="band-container">
          <div className="section-header">
            <span className="section-kicker">HOW IT WORKS</span>
            <h2 id="section-how-heading" className="section-title">
              Clear Your Inbox in 3 Simple Steps
            </h2>
            <p className="section-subtitle">
              No complicated setups, technical jargon, or prompting required. Mailroom works quietly in the background so you can breeze through your emails in minutes.
            </p>
          </div>

          <div className="pipeline-steps-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {/* Step 1 */}
            <div className="jotform-card step-card">
              <div className="step-number-tag">01</div>
              <div className="step-icon-box">
                <Lock size={20} />
              </div>
              <h3 className="step-heading">Connect Your Gmail</h3>
              <p className="step-copy">
                Link your Google account in under 30 seconds using Google's official one-click authorization. No passwords to remember or tricky software to install.
              </p>
              <div className="step-footer-tag">One-Click Setup</div>
            </div>

            {/* Step 2 */}
            <div className="jotform-card step-card">
              <div className="step-number-tag">02</div>
              <div className="step-icon-box">
                <Sparkles size={20} />
              </div>
              <h3 className="step-heading">Mailroom Writes Your Drafts</h3>
              <p className="step-copy">
                As soon as an email arrives, Mailroom reads the message, blocks spam, and crafts a clear, polite, and helpful response ready for your review.
              </p>
              <div className="step-footer-tag">Automatic Smart Drafting</div>
            </div>

            {/* Step 3 */}
            <div className="jotform-card step-card">
              <div className="step-number-tag">03</div>
              <div className="step-icon-box">
                <UserCheck size={20} />
              </div>
              <h3 className="step-heading">You Approve with 1 Click</h3>
              <p className="step-copy">
                Review the proposed reply in your review console. Click "Approve & send" or tweak the words in seconds. Nothing leaves your inbox without your say-so.
              </p>
              <div className="step-footer-tag">You're in Total Control</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. KEY BENEFITS FOR REAL USERS */}
      <section id="benefits" className="jotform-band band-surface-alt" aria-labelledby="section-feat-heading">
        <div className="band-container">
          <div className="section-header">
            <span className="section-kicker">WHY CHOOSE MAILROOM</span>
            <h2 id="section-feat-heading" className="section-title">
              Designed for People Who Receive Too Much Email
            </h2>
            <p className="section-subtitle">
              Get the speed of AI automation with the peace of mind that a human always has the final word.
            </p>
          </div>

          <div className="features-grid">
            <div className="jotform-card feature-card">
              <div className="feature-icon-wrapper purple-accent">
                <Clock size={22} />
              </div>
              <h3 className="feature-title">Save 2+ Hours Every Day</h3>
              <p className="feature-desc">
                Stop typing the same answers over and over. Mailroom prepares first drafts for customer questions, scheduling, price inquiries, and follow-ups.
              </p>
            </div>

            <div className="jotform-card feature-card">
              <div className="feature-icon-wrapper blue-accent">
                <ShieldCheck size={22} />
              </div>
              <h3 className="feature-title">Zero Accidental Sends</h3>
              <p className="feature-desc">
                Unlike unmonitored bots that reply behind your back, Mailroom holds important emails in your review queue until you give the green light.
              </p>
            </div>

            <div className="jotform-card feature-card">
              <div className="feature-icon-wrapper purple-accent">
                <Shield size={22} />
              </div>
              <h3 className="feature-title">Automatic Spam & Junk Blocker</h3>
              <p className="feature-desc">
                Cold sales pitches, phishing attempts, and promotional clutter are stopped at the door. You only spend time on emails that actually matter.
              </p>
            </div>

            <div className="jotform-card feature-card">
              <div className="feature-icon-wrapper blue-accent">
                <Sliders size={22} />
              </div>
              <h3 className="feature-title">Edit Any Draft in Seconds</h3>
              <p className="feature-desc">
                Want to tweak a sentence or add a personal note? Edit the draft directly in your browser before approving it. It's as easy as texting.
              </p>
            </div>

            <div className="jotform-card feature-card">
              <div className="feature-icon-wrapper purple-accent">
                <Lock size={22} />
              </div>
              <h3 className="feature-title">Your Privacy Stays Protected</h3>
              <p className="feature-desc">
                Your emails remain completely private to you. We use official Google security standards and never sell your data or train public AI models on your messages.
              </p>
            </div>

            <div className="jotform-card feature-card">
              <div className="feature-icon-wrapper blue-accent">
                <Zap size={22} />
              </div>
              <h3 className="feature-title">Super-Fast Keyboard Shortcuts</h3>
              <p className="feature-desc">
                Power through your morning review in under a minute with simple single-key shortcuts: press <kbd className="shortcut-hint">A</kbd> to approve, <kbd className="shortcut-hint">E</kbd> to edit, and <kbd className="shortcut-hint">R</kbd> to reject.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LIVE DEMO SANDBOX (FRIENDLY TEST DRIVE) */}
      <section id="sandbox" className="jotform-band band-canvas" aria-labelledby="section-sandbox-heading">
        <div className="band-container">
          <div className="section-header text-white">
            <span className="section-kicker kicker-accent">TRY IT YOURSELF</span>
            <h2 id="section-sandbox-heading" className="section-title text-white">
              See How Mailroom Drafts a Reply in Real Time
            </h2>
            <p className="section-subtitle text-hairline">
              Pick an example customer email below or type your own to see how Mailroom instantly analyzes the message and drafts a polite response.
            </p>
          </div>

          <div className="sandbox-layout">
            {/* Input Form */}
            <div className="jotform-card sandbox-card">
              <h3 className="sandbox-card-title">Sample Customer Email</h3>

              <div className="quick-presets">
                <span className="presets-label">Quick Examples:</span>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => {
                    setSimSender('alex.johnson@business-client.com');
                    setSimSubject('Pricing Inquiry for 50 User Team Plan');
                    setSimBody('Hi there,\n\nWe love your product and want to onboard our 50-person team next month. Could you share your enterprise pricing and available onboarding slots?\n\nThanks,\nAlex');
                  }}
                >
                  Pricing Question
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => {
                    setSimSender('support-request@customer.org');
                    setSimSubject('Question about my recent subscription charge');
                    setSimBody('Hello, I was charged twice for my subscription this morning. Can you please check my account and help me refund the duplicate charge?');
                  }}
                >
                  Refund / Support
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => {
                    setSimSender('winner@crypto-lottery-promo.xyz');
                    setSimSubject('CONGRATULATIONS YOU WON $10,000 CLAIM NOW');
                    setSimBody('You have been selected to win a cash prize! Click here immediately to claim your award before it expires.');
                  }}
                >
                  Junk Spam
                </button>
              </div>

              <form onSubmit={handleRunHomeSimulation} className="sandbox-form">
                <div className="form-group">
                  <label className="form-label">Customer's Email</label>
                  <input
                    type="email"
                    className="jotform-input"
                    value={simSender}
                    onChange={(e) => setSimSender(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="jotform-input"
                    value={simSubject}
                    onChange={(e) => setSimSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Customer's Message</label>
                  <textarea
                    rows={5}
                    className="jotform-textarea"
                    value={simBody}
                    onChange={(e) => setSimBody(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  id="btn-run-sandbox"
                  className="btn-jotform-primary"
                  disabled={isSimulatingLocal}
                >
                  <Play size={16} />
                  <span>{isSimulatingLocal ? 'Drafting Response...' : 'Draft AI Reply Now'}</span>
                </button>
              </form>
            </div>

            {/* Output Panel */}
            <div className="jotform-card sandbox-output-card">
              <div className="output-card-header">
                <h3 className="sandbox-card-title">Mailroom's Analysis & Draft</h3>
                {simResult && (
                  <span className={`result-status-badge ${simResult.is_spam ? 'badge-spam' : 'badge-legit'}`}>
                    {simResult.is_spam ? 'BLOCKED SPAM' : 'LEGITIMATE INQUIRY'}
                  </span>
                )}
              </div>

              {isSimulatingLocal ? (
                <div className="sandbox-eval-loading">
                  <RotateCw size={32} className="spin-icon text-accent" />
                  <p className="loading-title">Reading email and writing draft reply...</p>
                  <span className="loading-sub">Checking message safety and tone</span>
                </div>
              ) : simResult ? (
                <div className="simulation-result-view">
                  <div className="result-metric-grid">
                    <div className="metric-cell">
                      <span className="metric-label">TOPIC</span>
                      <span className="metric-val" style={{ textTransform: 'capitalize' }}>
                        {simResult.email_category || 'Inquiry'}
                      </span>
                    </div>
                    <div className="metric-cell">
                      <span className="metric-label">URGENCY</span>
                      <span className="metric-val" style={{ textTransform: 'capitalize' }}>
                        {simResult.priority || 'Normal'}
                      </span>
                    </div>
                    <div className="metric-cell">
                      <span className="metric-label">YOUR APPROVAL</span>
                      <span className="metric-val">
                        {simResult.requires_approval ? 'Required Before Sending' : 'Ready'}
                      </span>
                    </div>
                  </div>

                  {simResult.is_spam ? (
                    <div className="spam-report-box">
                      <AlertTriangle size={20} className="text-warning" />
                      <div>
                        <strong>Filtered as Spam:</strong>
                        <p>{simResult.spam_reason || 'Identified as unsolicited promotional or phishing junk.'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="draft-preview-box">
                      <div className="draft-header">
                        <span className="draft-title">Proposed Reply Draft</span>
                        <span className="draft-status">Ready for your approval</span>
                      </div>
                      <pre className="draft-body">{simResult.draft || 'No reply needed.'}</pre>
                    </div>
                  )}

                  <div className="result-actions">
                    <button
                      className="btn-jotform-secondary-sm"
                      onClick={onOpenConsole}
                    >
                      <Inbox size={15} />
                      <span>Inspect in Review Console</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="sandbox-idle-state">
                  <div className="idle-icon-wrap">
                    <Sparkles size={36} />
                  </div>
                  <h4>Ready to test</h4>
                  <p>Select a sample preset on the left or type your own email, then click "Draft AI Reply Now" to see how Mailroom writes an accurate, polite response.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION FOR LAYMEN */}
      <section id="faq" className="jotform-band band-neutral-4" aria-labelledby="faq-heading">
        <div className="band-container">
          <div className="section-header">
            <span className="section-kicker">HAVE QUESTIONS?</span>
            <h2 id="faq-heading" className="section-title">
              Frequently Asked Questions
            </h2>
            <p className="section-subtitle">
              Everything you need to know about how Mailroom keeps your inbox organized and completely under your control.
            </p>
          </div>

          <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <div className="jotform-card feature-card">
              <div className="feature-icon-wrapper purple-accent">
                <HelpCircle size={20} />
              </div>
              <h3 className="feature-title">Will Mailroom send emails without my permission?</h3>
              <p className="feature-desc">
                <strong>Never.</strong> Mailroom is built with strict human oversight. It drafts responses and holds them in your "Needs Review" queue. Nothing leaves your inbox until you click "Approve & send".
              </p>
            </div>

            <div className="jotform-card feature-card">
              <div className="feature-icon-wrapper blue-accent">
                <HelpCircle size={20} />
              </div>
              <h3 className="feature-title">Can I edit the draft before sending?</h3>
              <p className="feature-desc">
                <strong>Yes, absolutely.</strong> You can edit any sentence, change the greeting, or add personal details directly in the built-in editor before giving your approval.
              </p>
            </div>

            <div className="jotform-card feature-card">
              <div className="feature-icon-wrapper purple-accent">
                <HelpCircle size={20} />
              </div>
              <h3 className="feature-title">Is my Gmail account safe and private?</h3>
              <p className="feature-desc">
                <strong>100% yes.</strong> We use Google's official OAuth 2.0 system. We never see or store your Google password, and we never sell your data or use your personal messages to train public AI models.
              </p>
            </div>

            <div className="jotform-card feature-card">
              <div className="feature-icon-wrapper blue-accent">
                <HelpCircle size={20} />
              </div>
              <h3 className="feature-title">How do I disconnect my Gmail account?</h3>
              <p className="feature-desc">
                You can disconnect your account at any time with a single click on "Disconnect" in the sidebar or home screen. Once disconnected, all sync stops immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CALL-TO-ACTION BAND */}
      <section className="jotform-band band-primary" aria-labelledby="cta-heading">
        <div className="band-container text-center">
          <h2 id="cta-heading" className="cta-banner-title">
            Put Your Gmail Inbox on Safe Autopilot Today
          </h2>
          <p className="cta-banner-subtitle">
            Connect your Gmail account in less than 30 seconds. Experience the peace of mind of having an AI assistant that drafts your emails while keeping you in total control.
          </p>

          <div className="cta-banner-buttons">
            {hasConnectedAccount ? (
              <button
                id="btn-footer-launch"
                className="btn-jotform-secondary-xl"
                onClick={onOpenConsole}
              >
                <span>Open Mailroom Console</span>
                <ArrowRight size={20} />
              </button>
            ) : (
              <button
                id="btn-footer-connect"
                className="btn-jotform-secondary-xl"
                onClick={handleConnectGmail}
              >
                <span>Connect with Gmail — Free</span>
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="jotform-footer" role="contentinfo">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="brand-icon">
                <Mail size={16} strokeWidth={2.5} />
              </div>
              <span className="footer-brand-title">Mailroom</span>
            </div>
            <div className="footer-meta">
              <span>The smart, human-approved AI email assistant for Gmail</span>
            </div>
          </div>

          <div className="footer-links-row" style={{ display: 'flex', gap: '16px', margin: '14px 0', fontSize: '13px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onNavigatePrivacy}
              id="footer-link-privacy"
              className="btn-legal-link"
              style={{ padding: 0 }}
            >
              Privacy Policy
            </button>
            <span style={{ color: 'var(--border)' }}>•</span>
            <button
              onClick={onNavigateTerms}
              id="footer-link-terms"
              className="btn-legal-link"
              style={{ padding: 0 }}
            >
              Terms of Service
            </button>
            <span style={{ color: 'var(--border)' }}>•</span>
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-legal-link"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
            >
              <span>Google Limited Use Policy</span>
              <span style={{ fontSize: '11px' }}>↗</span>
            </a>
          </div>

          <div className="footer-bottom">
            <p className="copyright">
              © {new Date().getFullYear()} Mailroom. All rights reserved.
            </p>
            <div className="footer-badges">
              <span className="footer-badge">Google OAuth Verified</span>
              <span className="footer-badge">100% Human In The Loop</span>
              <span className="footer-badge">Zero Data Selling</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
