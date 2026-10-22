import React from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  Mail,
  Lock,
  Database,
  EyeOff,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';

export default function PrivacyPolicy({ onBack, onNavigateTerms, theme, onToggleTheme }) {
  return (
    <div className="legal-page-wrapper">
      {/* Top Navigation Bar */}
      <header className="legal-nav" role="banner">
        <div className="legal-nav-content">
          <div className="legal-nav-left">
            <button
              onClick={onBack}
              className="btn-legal-back"
              id="btn-privacy-back"
              aria-label="Back to previous page"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div className="legal-brand" onClick={onBack} role="button" tabIndex={0}>
              <div className="brand-icon">
                <Mail size={16} strokeWidth={2.5} />
              </div>
              <span className="brand-name">Mailroom</span>
            </div>
          </div>

          <div className="legal-nav-right">
            <button
              onClick={onNavigateTerms}
              className="btn-legal-nav-link"
              id="link-nav-terms"
            >
              Terms of Service
            </button>
            <button
              onClick={onToggleTheme}
              className="btn-theme-toggle"
              aria-label="Toggle dark/light mode"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="legal-main" role="main">
        <article className="legal-article">
          <div className="legal-header-block">
            <div className="legal-badge">
              <ShieldCheck size={14} />
              <span>Official Privacy Policy</span>
            </div>
            <h1 className="legal-title">Privacy Policy</h1>
            <p className="legal-subtitle">
              Last Updated: October 2026 • Effective Date: October 21, 2026
            </p>
          </div>

          {/* Quick Summary / Google Commitment Callout */}
          <div className="legal-callout callout-google">
            <div className="callout-icon">
              <Lock size={20} />
            </div>
            <div className="callout-body">
              <h3 className="callout-title">Google API Services User Data Policy Compliance</h3>
              <p>
                Mailroom’s use and transfer to any other app of information received from Google APIs
                will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="legal-link"
                >
                  Google API Services User Data Policy
                  <ExternalLink size={12} style={{ display: 'inline', marginLeft: '3px' }} />
                </a>
                , including the <strong>Limited Use</strong> requirements.
              </p>
              <ul className="callout-list">
                <li>We <strong>do not</strong> use your email content to train generalized public AI models.</li>
                <li>We <strong>never sell</strong> or transfer your personal email data to advertisers or data brokers.</li>
                <li>We only access the email data required to draft context-aware replies for your approval.</li>
              </ul>
            </div>
          </div>

          {/* Section 1 */}
          <section className="legal-section" id="overview">
            <h2>1. Overview & Service Purpose</h2>
            <p>
              Mailroom (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) provides an intelligent, human-in-the-loop email triage
              and drafting application. Mailroom connects with your Gmail account to help you categorize incoming messages,
              detect spam, draft proposed responses using AI, and send replies either upon your explicit human approval
              or autonomously for verified low-risk inquiries.
            </p>
            <p>
              This Privacy Policy explains what personal information we collect, how it is processed and protected,
              and your rights regarding your data.
            </p>
          </section>

          {/* Section 2 */}
          <section className="legal-section" id="data-collected">
            <h2>2. Information We Collect and Access</h2>
            <p>
              When you use Mailroom, we collect and access information exclusively to provide our email assistance services:
            </p>
            <h3>A. Information from Google Accounts (via OAuth 2.0)</h3>
            <p>
              With your explicit authorization via Google OAuth, we access:
            </p>
            <ul>
              <li>
                <strong>Google Account Profile:</strong> Your primary Gmail address and basic account profile to authenticate
                your session and associate your preferences.
              </li>
              <li>
                <strong>Email Messages and Metadata:</strong> Message headers (Sender, Recipient, Subject, Date),
                message body (text and HTML content), thread identifiers, and message IDs via the{' '}
                <code>https://www.googleapis.com/auth/gmail.readonly</code> scope.
              </li>
              <li>
                <strong>Outbound Message Dispatch:</strong> Permission to send replies on your behalf via the{' '}
                <code>https://www.googleapis.com/auth/gmail.send</code> scope. Outbound messages are only sent when
                a draft passes our verification criteria or when you click &quot;Approve&quot; in the Mailroom console.
              </li>
            </ul>

            <h3>B. Session & Technical Information</h3>
            <ul>
              <li>
                <strong>Encrypted Session Tokens:</strong> Cryptographically signed HTTP-only cookies to keep you signed in
                securely without storing raw passwords.
              </li>
              <li>
                <strong>Audit Logs:</strong> Timestamps of classification, draft generation, and approval decisions for your inspection.
              </li>
            </ul>
          </section>

          {/* Section 3: Google Limited Use */}
          <section className="legal-section" id="limited-use">
            <h2>3. Google User Data: Limited Use & Restrictions</h2>
            <p>
              We treat your Gmail messages with the highest degree of confidentiality and data minimization.
              In accordance with Google’s API Services User Data Policy:
            </p>
            <div className="legal-grid-cards">
              <div className="legal-card">
                <div className="legal-card-icon"><EyeOff size={18} /></div>
                <h4>Zero Model Training</h4>
                <p>
                  Your email content, recipient details, and message drafts are <strong>never</strong> used to train,
                  retrain, or fine-tune public, commercial, or foundational artificial intelligence / LLM models.
                </p>
              </div>

              <div className="legal-card">
                <div className="legal-card-icon"><Database size={18} /></div>
                <h4>No Sale or Monetization</h4>
                <p>
                  We do not sell, rent, or lease your email data, contact lists, or metadata to third parties,
                  data brokers, advertising networks, or marketing platforms.
                </p>
              </div>

              <div className="legal-card">
                <div className="legal-card-icon"><UserCheck size={18} /></div>
                <h4>Human-in-the-Loop Privacy</h4>
                <p>
                  Our personnel do not read or view your emails unless you explicitly request customer support
                  and provide consent, or where required by law.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="legal-section" id="how-we-use">
            <h2>4. How We Process Your Data</h2>
            <p>We process your email data solely for the following functional purposes:</p>
            <ul>
              <li>
                <strong>Triage & Spam Detection:</strong> Classifying incoming emails as spam, inquiry, sales, scheduling,
                or complaint to help you prioritize urgent matters.
              </li>
              <li>
                <strong>Contextual Response Drafting:</strong> Synthesizing proposed replies using secure inference
                via the Google Gemini API. Inference is transient and subject to Google Cloud’s enterprise privacy commitments.
              </li>
              <li>
                <strong>Safety & Policy Verification:</strong> Running automated safety checks to verify that drafts do not make
                unauthorized factual promises, reveal sensitive credentials, or use inappropriate tone.
              </li>
              <li>
                <strong>Dispatched Replies:</strong> Transmitting the finalized and approved text back to the original sender
                through the Gmail API.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="legal-section" id="security">
            <h2>5. Data Security & Storage</h2>
            <p>We implement multi-layered technical safeguards to protect your personal data:</p>
            <ul>
              <li>
                <strong>Encryption at Rest:</strong> All Google OAuth refresh and access tokens are encrypted
                using 256-bit AES (Fernet symmetric encryption) before being saved in our PostgreSQL database.
              </li>
              <li>
                <strong>Encryption in Transit:</strong> All communication between your browser, our servers,
                and Google APIs is encrypted using TLS 1.3 / HTTPS.
              </li>
              <li>
                <strong>Tenant Isolation:</strong> Email records and drafts are strictly tied to your authenticated
                account ID. Cross-tenant access is programmatically prevented.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="legal-section" id="retention-deletion">
            <h2>6. Data Retention & Your Right to Deletion</h2>
            <p>
              You maintain total control over your data. We retain processed email records only as long as you maintain
              an active connection with Mailroom.
            </p>
            <p>You can exercise your deletion rights at any time:</p>
            <ul>
              <li>
                <strong>One-Click Account Disconnect:</strong> Clicking &quot;Disconnect&quot; in the Mailroom console or home screen
                instantly halts all background synchronization and deletes your active session cookie.
              </li>
              <li>
                <strong>Permanent Data Wipe (&quot;Delete All Data&quot;):</strong> Clicking &quot;Delete My Data&quot; in account settings
                permanently removes all your email records, AI drafts, analysis logs, and LangGraph workflow checkpoints
                from our PostgreSQL database, and initiates a token revocation request with Google.
              </li>
              <li>
                <strong>Revoke Access via Google:</strong> You can also revoke Mailroom’s access directly from your{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="legal-link"
                >
                  Google Account Security Settings
                  <ExternalLink size={12} style={{ display: 'inline', marginLeft: '3px' }} />
                </a>.
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="legal-section" id="subprocessors">
            <h2>7. Third-Party Sub-processors</h2>
            <p>
              We only share data with infrastructure providers strictly necessary to deliver the Mailroom application:
            </p>
            <div className="legal-table-wrap">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Sub-processor</th>
                    <th>Purpose</th>
                    <th>Data Transferred</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Google Cloud Platform & Gmail API</strong></td>
                    <td>OAuth authentication, email ingestion, and sending replies</td>
                    <td>Google user ID, email content, RFC 2822 messages</td>
                  </tr>
                  <tr>
                    <td><strong>Google Gemini API (Vertex AI / AI Studio)</strong></td>
                    <td>Zero-data-retention inference for classification and draft generation</td>
                    <td>Message snippet and draft context (not retained for training)</td>
                  </tr>
                  <tr>
                    <td><strong>PostgreSQL Database Host</strong></td>
                    <td>Encrypted storage of user accounts, state, and email drafts</td>
                    <td>Encrypted OAuth credentials, drafts, workflow states</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 8 */}
          <section className="legal-section" id="contact">
            <h2>8. Contact & Privacy Inquiries</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled,
              please contact our Data Protection team:
            </p>
            <div className="legal-contact-card">
              <p><strong>Mailroom Privacy Team</strong></p>
              <p>Email: <a href="mailto:privacy@mailroom.app" className="legal-link">privacy@mailroom.app</a></p>
              <p>Support: <a href="mailto:support@mailroom.app" className="legal-link">support@mailroom.app</a></p>
            </div>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="legal-footer">
        <div className="legal-footer-content">
          <p>© {new Date().getFullYear()} Mailroom. All rights reserved.</p>
          <div className="legal-footer-links">
            <button onClick={onNavigateTerms} className="btn-legal-link">
              Terms of Service
            </button>
            <button onClick={onBack} className="btn-legal-link">
              Home
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
