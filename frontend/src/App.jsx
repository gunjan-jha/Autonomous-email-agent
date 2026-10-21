import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import SimulationModal from './components/SimulationModal';
import ToastContainer from './components/ToastContainer';
import GmailHome from './components/GmailHome';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [emails, setEmails] = useState([]);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // View mode: 'home' (Jotform landing & Gmail connect) | 'console' (3-column inbox review)
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    if (hash === '#console' || params.get('view') === 'console' || params.get('connected') === 'true') {
      return 'console';
    }
    return 'home';
  });

  const [connectedAccounts, setConnectedAccounts] = useState([]);
  
  // Navigation Queues: 'review' | 'sent' | 'spam' | 'all'
  const [activeQueue, setActiveQueue] = useState('review');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Theme: Crisp white by default
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('mailroom-theme') || localStorage.getItem('aegis-theme');
    return saved === 'dark' ? 'light' : (saved || 'light');
  });

  // Draft editing state
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editedDraft, setEditedDraft] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Simulation Modal
  const [showSimModal, setShowSimModal] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Mobile navigation state
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Initialize theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mailroom-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch connected Gmail accounts and route appropriately:
  // - If an email IS connected: automatically direct to email console
  // - If NO email is connected: automatically redirect to home page
  const fetchConnectedAccounts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/integrations/gmail/accounts`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        const accounts = data || [];
        setConnectedAccounts(accounts);

        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        const justConnected = params.get('connected') === 'true';

        if (justConnected) {
          addToast('Gmail connected successfully! Welcome to the email console.', 'success');
          window.history.replaceState({}, document.title, window.location.pathname);
          setCurrentView('console');
        } else if (accounts.length > 0) {
          // If email is connected, default to console unless user explicitly visited #home
          if (hash !== '#home' && params.get('view') !== 'home') {
            setCurrentView('console');
          }
        } else {
          // If no email is connected, always redirect to home page
          setCurrentView('home');
        }
      } else {
        setCurrentView('home');
      }
    } catch (err) {
      console.warn('Could not check connected accounts:', err);
    }
  }, [addToast]);

  useEffect(() => {
    fetchConnectedAccounts();
  }, [fetchConnectedAccounts]);

  // Handle disconnecting the current Gmail account
  const handleDisconnectAccount = async (accountId) => {
    if (!window.confirm('Are you sure you want to disconnect this Gmail account?')) return;
    try {
      const res = await fetch(`${API_BASE}/integrations/gmail/accounts/${accountId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to disconnect');
      addToast('Gmail account disconnected. Returning to home page.', 'info');
      setConnectedAccounts([]);
      setCurrentView('home');
    } catch (err) {
      addToast(`Disconnect failed: ${err.message}`, 'error');
    }
  };

  // Fetch emails from backend
  const fetchEmails = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/emails`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      const list = data.emails || [];
      setEmails(list);

      // Select first email if none selected yet
      if (!selectedEmailId && list.length > 0) {
        setSelectedEmailId(list[0].email_id);
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
      if (!silent) {
        addToast(`Cannot reach backend at ${API_BASE}. Ensure server is running.`, 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(() => fetchEmails(true), 12000); // 12s background polling
    return () => clearInterval(interval);
  }, []);

  // Helper: check if an email is awaiting human review
  const isEmailPendingReview = (e) => {
    if (!e || e.is_spam) return false;
    // If a human decision has already been recorded, it is no longer pending
    if (e.human_decision && e.human_decision.trim() !== '') return false;
    return Boolean(
      e.send_status === 'pending_approval' ||
      e.requires_approval ||
      e.verification?.requires_human
    );
  };

  // Compute Queue Counts
  const queueCounts = useMemo(() => {
    const review = emails.filter((e) => isEmailPendingReview(e)).length;
    const sent = emails.filter(
      (e) =>
        e.human_decision === 'approved' ||
        e.send_status === 'sent' ||
        e.send_status === 'approved_for_sending' ||
        e.send_status === 'dry_run_success'
    ).length;
    const spam = emails.filter((e) => e.is_spam).length;
    const all = emails.length;
    return { review, sent, spam, all };
  }, [emails]);

  // Unique categories list
  const categories = useMemo(() => {
    const base = ['all', 'sales', 'marketing', 'notification', 'complaint'];
    const dynamic = emails.map((e) => (e.category || '').toLowerCase()).filter(Boolean);
    const combined = Array.from(new Set([...base, ...dynamic]));
    return combined;
  }, [emails]);

  // Filter emails based on Active Queue, Category, and Search Query
  const filteredEmails = useMemo(() => {
    return emails.filter((item) => {
      // 1. Queue filter
      if (activeQueue === 'review') {
        if (!isEmailPendingReview(item)) return false;
      } else if (activeQueue === 'sent') {
        const isSent =
          item.human_decision === 'approved' ||
          item.send_status === 'sent' ||
          item.send_status === 'approved_for_sending' ||
          item.send_status === 'dry_run_success';
        if (!isSent) return false;
      } else if (activeQueue === 'spam') {
        if (!item.is_spam) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all') {
        if ((item.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // 3. Search query filter (subject, sender, body)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = (item.subject || '').toLowerCase().includes(q);
        const matchSender = (item.sender || '').toLowerCase().includes(q);
        const matchBody = (item.body || '').toLowerCase().includes(q);
        if (!matchSubject && !matchSender && !matchBody) return false;
      }

      return true;
    });
  }, [emails, activeQueue, selectedCategory, searchQuery]);

  // Ensure Detail Pane always matches the selected email in active filtered list
  useEffect(() => {
    if (filteredEmails.length > 0) {
      const isSelectedInList = filteredEmails.some((e) => e.email_id === selectedEmailId);
      if (!isSelectedInList) {
        setSelectedEmailId(filteredEmails[0].email_id);
      }
    } else {
      setSelectedEmailId(null);
    }
  }, [filteredEmails, selectedEmailId]);

  // Currently selected email object
  const selectedEmail = useMemo(() => {
    return emails.find((e) => e.email_id === selectedEmailId) || null;
  }, [emails, selectedEmailId]);

  // Sync draft editor text when selected email changes
  useEffect(() => {
    if (selectedEmail) {
      setEditedDraft(selectedEmail.draft || '');
      setIsEditingDraft(false);
      setFeedback('');
    }
  }, [selectedEmailId, selectedEmail?.draft]);

  // Keyboard Shortcuts: J/K to move, A to approve, E to edit, R to reject
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) {
        return; // Guard active form inputs
      }
      if (showSimModal) return;

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        if (filteredEmails.length === 0) return;
        const currentIndex = filteredEmails.findIndex((item) => item.email_id === selectedEmailId);
        if (currentIndex === -1) {
          setSelectedEmailId(filteredEmails[0].email_id);
        } else if (currentIndex < filteredEmails.length - 1) {
          setSelectedEmailId(filteredEmails[currentIndex + 1].email_id);
        }
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (filteredEmails.length === 0) return;
        const currentIndex = filteredEmails.findIndex((item) => item.email_id === selectedEmailId);
        if (currentIndex === -1) {
          setSelectedEmailId(filteredEmails[0].email_id);
        } else if (currentIndex > 0) {
          setSelectedEmailId(filteredEmails[currentIndex - 1].email_id);
        }
      } else if (e.key === 'a' || e.key === 'A') {
        if (selectedEmail && isEmailPendingReview(selectedEmail)) {
          e.preventDefault();
          handleDecision(true);
        }
      } else if (e.key === 'e' || e.key === 'E') {
        if (selectedEmail && !selectedEmail.is_spam) {
          e.preventDefault();
          setIsEditingDraft((prev) => !prev);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedEmail && isEmailPendingReview(selectedEmail)) {
          e.preventDefault();
          handleDecision(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredEmails, selectedEmailId, selectedEmail, showSimModal]);

  // Trigger Gmail Poll
  const handleTriggerPoll = async () => {
    setPolling(true);
    addToast('Polling Gmail inbox for unread messages...', 'info');
    try {
      const res = await fetch(`${API_BASE}/integrations/gmail/poll?limit=1`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Poll failed');

      const polled = data.results?.[0];
      if (polled && polled.emails_processed > 0) {
        addToast(`Processed ${polled.emails_processed} new email from Gmail!`, 'success');
      } else if (polled && polled.emails_skipped > 0) {
        addToast('No new unread messages (already processed).', 'info');
      } else {
        addToast('Inbox checked: No new messages found.', 'info');
      }
      await fetchEmails(true);
    } catch (err) {
      console.error(err);
      addToast(`Poll error: ${err.message}`, 'error');
    } finally {
      setPolling(false);
    }
  };

  // Submit Approval Decision (Approve / Reject)
  const handleDecision = async (approved) => {
    if (!selectedEmail) return;
    setSubmittingAction(true);
    const endpoint = approved ? 'approve' : 'reject';

    try {
      const payload = {
        feedback: feedback.trim(),
        edited_draft: approved && isEditingDraft ? editedDraft.trim() : null
      };

      const res = await fetch(
        `${API_BASE}/approvals/emails/${selectedEmail.email_id}/${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include'
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Failed to ${endpoint}`);

      addToast(
        approved
          ? `Draft approved! Dispatched reply to ${selectedEmail.sender}`
          : `Reply rejected. Email marked as rejected.`,
        approved ? 'success' : 'info'
      );

      setIsEditingDraft(false);
      await fetchEmails(true);
    } catch (err) {
      console.error(err);
      addToast(`Approval error: ${err.message}`, 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Simulate Inbound Email
  const handleRunSimulation = async (simForm) => {
    setSimulating(true);
    addToast('Executing LangGraph agent pipeline...', 'info');

    const emailId = `sim-${Date.now()}`;
    const payload = {
      email_id: emailId,
      thread_id: `thread-${Date.now()}`,
      sender: simForm.sender,
      recipient: 'support@mailroom.app',
      subject: simForm.subject,
      body: simForm.body
    };

    try {
      const res = await fetch(`${API_BASE}/emails/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Simulation failed');

      addToast(`Agent processed email: ${data.status || 'Finished'}`, 'success');
      setShowSimModal(false);
      await fetchEmails(true);
      setSelectedEmailId(emailId);
      setMobileDetailOpen(true);
    } catch (err) {
      console.error(err);
      addToast(`Simulation error: ${err.message}`, 'error');
    } finally {
      setSimulating(false);
    }
  };

  // Copy text to clipboard helper
  const handleCopyText = (text, label = 'Text') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    addToast(`${label} copied to clipboard!`, 'success');
  };

  // Restore Spam Action (TODO marked for backend)
  const handleRestoreSpam = () => {
    if (!selectedEmail) return;
    // TODO: Connect to backend endpoint POST /emails/{selectedEmail.email_id}/restore or /unmark-spam
    addToast(
      `TODO: Backend endpoint needed to restore email "${selectedEmail.email_id}" from spam. Add POST /emails/{id}/restore on backend.`,
      'info'
    );
  };

  const handleSelectEmail = (id) => {
    setSelectedEmailId(id);
    setMobileDetailOpen(true);
  };

  if (currentView === 'home') {
    return (
      <>
        <GmailHome
          apiBase={API_BASE}
          onOpenConsole={() => {
            if (connectedAccounts.length === 0) {
              addToast('Please connect your Gmail account first to access the console.', 'info');
              return;
            }
            setCurrentView('console');
          }}
          onTriggerPoll={handleTriggerPoll}
          isPolling={polling}
          onSimulateEmail={handleRunSimulation}
          addToast={addToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="app-layout">
      {/* Column 1: Left Sidebar (~200px) */}
      <Sidebar
        activeQueue={activeQueue}
        onSelectQueue={(q) => {
          setActiveQueue(q);
          setMobileDetailOpen(false);
        }}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setMobileDetailOpen(false);
        }}
        queueCounts={queueCounts}
        categories={categories}
        theme={theme}
        onToggleTheme={toggleTheme}
        onPollInbox={handleTriggerPoll}
        isPolling={polling}
        onTestEmail={() => setShowSimModal(true)}
        onGoHome={() => setCurrentView('home')}
        connectedAccount={connectedAccounts[0] || null}
        onDisconnect={handleDisconnectAccount}
      />

      {/* Column 2: Middle Email List (~340px) */}
      <EmailList
        emails={filteredEmails}
        selectedEmailId={selectedEmailId}
        onSelectEmail={handleSelectEmail}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeQueue={activeQueue}
        isLoading={loading}
      />

      {/* Column 3: Right Detail Pane */}
      <EmailDetail
        email={selectedEmail}
        isEditingDraft={isEditingDraft}
        editedDraft={editedDraft}
        onDraftChange={setEditedDraft}
        onToggleEditDraft={() => setIsEditingDraft((prev) => !prev)}
        onApprove={() => handleDecision(true)}
        onReject={() => handleDecision(false)}
        onRestoreSpam={handleRestoreSpam}
        isSubmitting={submittingAction}
        onCopyText={handleCopyText}
        onMobileBack={() => setMobileDetailOpen(false)}
      />

      {/* Test Simulation Modal */}
      <SimulationModal
        isOpen={showSimModal}
        onClose={() => setShowSimModal(false)}
        onRunSimulation={handleRunSimulation}
        isSimulating={simulating}
      />

      {/* Flat Toasts Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
