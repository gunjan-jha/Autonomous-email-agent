import React from 'react';
import {
  FileText,
  ArrowLeft,
  Mail,
  CheckCircle,
  AlertOctagon,
  Scale,
  Shield,
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react';

export default function TermsOfService({ onBack, onNavigatePrivacy, theme, onToggleTheme }) {
  return (
    <div className="legal-page-wrapper">
      {/* Top Navigation Bar */}
      <header className="legal-nav" role="banner">
        <div className="legal-nav-content">
          <div className="legal-nav-left">
            <button
              onClick={onBack}
              className="btn-legal-back"
              id="btn-terms-back"
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
              onClick={onNavigatePrivacy}
              className="btn-legal-nav-link"
              id="link-nav-privacy"
            >
              Privacy Policy
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
              <FileText size={14} />
              <span>Official Terms of Service</span>
            </div>
            <h1 className="legal-title">Terms of Service</h1>
            <p className="legal-subtitle">
              Last Updated: October 2026 • Effective Date: October 21, 2026
            </p>
          </div>

          {/* Core Service Promise Callout */}
          <div className="legal-callout callout-terms">
            <div className="callout-icon">
              <Scale size={20} />
            </div>
            <div className="callout-body">
              <h3 className="callout-title">Summary of Your Rights & Responsibilities</h3>
              <p>
                Mailroom is an AI-powered email productivity tool designed to help you draft and manage emails safely.
                By using Mailroom:
              </p>
              <ul className="callout-list">
                <li>You own all of your original emails, drafts, and business content.</li>
                <li>AI drafts are suggestions — you remain in total control of what gets approved and sent.</li>
                <li>You agree not to use Mailroom for sending unsolicited bulk marketing, spam, or abusive communications.</li>
              </ul>
            </div>
          </div>

          {/* Section 1 */}
          <section className="legal-section" id="acceptance">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing our website, connecting your Google Account, or utilizing any features of Mailroom
              (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;) and our{' '}
              <button onClick={onNavigatePrivacy} className="legal-text-button">
                Privacy Policy
              </button>
              . If you do not agree to all terms, you must not access or use the Service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="legal-section" id="service-description">
            <h2>2. Description of the Service</h2>
            <p>
              Mailroom provides automated and assisted email management software. Key features include:
            </p>
            <ul>
              <li>Connecting to your Gmail inbox via Google OAuth 2.0.</li>
              <li>Filtering spam and categorizing incoming correspondence (e.g. inquiries, scheduling, complaints).</li>
              <li>Synthesizing draft replies using generative artificial intelligence models.</li>
              <li>Running safety policy verifications on draft replies before presenting them for human review.</li>
              <li>Transmitting approved or verified routine replies back through your Gmail account.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="legal-section" id="human-in-the-loop">
            <h2>3. AI Disclaimer & Human-in-the-Loop Supervision</h2>
            <p>
              Mailroom leverages state-of-the-art generative artificial intelligence models. However, AI-generated
              content can occasionally contain inaccuracies, incomplete context, or stylistic discrepancies:
            </p>
            <div className="legal-grid-cards">
              <div className="legal-card">
                <div className="legal-card-icon"><CheckCircle size={18} /></div>
                <h4>Drafts Are Suggestions</h4>
                <p>
                  All generated draft responses are proposed suggestions intended to assist you. You are given full ability
                  to inspect, revise, edit, or reject any draft before it is dispatched.
                </p>
              </div>

              <div className="legal-card">
                <div className="legal-card-icon"><AlertOctagon size={18} /></div>
                <h4>Your Responsibility</h4>
                <p>
                  You are solely responsible for all messages sent through your Gmail account. Review drafts carefully,
                  especially for sensitive financial, legal, medical, or contractual matters.
                </p>
              </div>

              <div className="legal-card">
                <div className="legal-card-icon"><Shield size={18} /></div>
                <h4>Autonomous Thresholds</h4>
                <p>
                  Autonomous sending is strictly limited to low-risk, verified inquiries. Any sensitive or complaint-related
                  messages are halted at a human checkpoint requiring your explicit review.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="legal-section" id="acceptable-use">
            <h2>4. Acceptable Use Policy</h2>
            <p>You agree to use Mailroom exclusively for lawful and legitimate email communications. You agree NOT to:</p>
            <ul>
              <li>Use the Service to transmit unsolicited bulk commercial email (spam) in violation of CAN-SPAM, GDPR, or applicable laws.</li>
              <li>Engage in phishing, social engineering, identity theft, or deceptive impersonation of individuals or entities.</li>
              <li>Transmit harassing, defamatory, fraudulent, threatening, obscene, or unlawful materials.</li>
              <li>Attempt to reverse-engineer, decompile, or tamper with the Mailroom platform or automated pipelines.</li>
              <li>Circumvent or attempt to bypass any rate limits, authentication barriers, or security guardrails.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="legal-section" id="google-compliance">
            <h2>5. Google Account Authorization & Compliance</h2>
            <p>
              By authorizing Mailroom to connect to your Gmail account, you confirm that you have the right and authority
              to grant us access. You acknowledge that your use of Google services is additionally governed by Google’s
              Terms of Service and Google’s Acceptable Use Policies.
            </p>
            <p>
              You may revoke Mailroom’s access to your Google account at any time via your Google Account Permissions portal
              or by clicking &quot;Disconnect&quot; inside the Mailroom application.
            </p>
          </section>

          {/* Section 6 */}
          <section className="legal-section" id="intellectual-property">
            <h2>6. Intellectual Property & Ownership</h2>
            <p>
              <strong>Your Content:</strong> You retain complete ownership of all incoming emails, outgoing messages,
              customer data, and customized drafts. Mailroom claims no ownership over any of your intellectual property.
            </p>
            <p>
              <strong>Mailroom Platform:</strong> The visual interface, underlying workflow state machines, algorithms,
              logos, and software code are the proprietary intellectual property of Mailroom and are protected by applicable
              copyright and trademark laws.
            </p>
          </section>

          {/* Section 7 */}
          <section className="legal-section" id="warranty-disclaimer">
            <h2>7. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND,
              WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, NON-INFRINGEMENT, OR ACCURACY OF AI-GENERATED CONTENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              UNINTERRUPTED, SECURE, OR ERROR-FREE AT ALL TIMES.
            </p>
          </section>

          {/* Section 8 */}
          <section className="legal-section" id="liability">
            <h2>8. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL MAILROOM, ITS DIRECTORS, EMPLOYEES,
              OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT
              NOT LIMITED TO LOSS OF PROFITS, DATA LOSS, BUSINESS INTERRUPTION, OR REPUTATIONAL HARM ARISING OUT OF YOUR USE
              OF OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          {/* Section 9 */}
          <section className="legal-section" id="termination">
            <h2>9. Termination & Account Deletion</h2>
            <p>
              You may terminate these Terms at any time by disconnecting your Gmail account and deleting your data through
              the Mailroom console. We reserve the right to suspend or terminate access to the Service immediately and
              without prior notice if you violate these Terms or engage in abusive or fraudulent conduct.
            </p>
          </section>

          {/* Section 10 */}
          <section className="legal-section" id="governing-law">
            <h2>10. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
              Mailroom operates, without regard to its conflict of law provisions. Any dispute arising under these Terms
              shall be resolved through binding arbitration or the appropriate courts of competent jurisdiction.
            </p>
          </section>

          {/* Section 11 */}
          <section className="legal-section" id="contact">
            <h2>11. Contact & Questions</h2>
            <p>
              If you have any questions or require clarification regarding these Terms of Service, please reach out to us:
            </p>
            <div className="legal-contact-card">
              <p><strong>Mailroom Legal & Support</strong></p>
              <p>Email: <a href="mailto:legal@mailroom.app" className="legal-link">legal@mailroom.app</a></p>
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
            <button onClick={onNavigatePrivacy} className="btn-legal-link">
              Privacy Policy
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
