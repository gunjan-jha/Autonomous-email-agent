import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

export const SIMULATION_PRESETS = [
  {
    name: "🚨 Angry Refund Demand (Escalation)",
    sender: "mark.stevens@clientcorp.io",
    subject: "URGENT: Immediate refund demanded or taking legal action",
    body: "I am writing to demand an immediate refund of $4,500 charged to our invoice #INV-9821. Your software caused downtime during our critical launch. If this is not refunded to our account within 24 hours, I am filing an official complaint with consumer protection and instructing our legal counsel to proceed."
  },
  {
    name: "💼 Enterprise Consulting Inquiry",
    sender: "sarah.chen@innovateai.com",
    subject: "Partnership and consulting services for Q3",
    body: "Hello Team, we recently reviewed your autonomous agent architecture and are interested in scheduling an introductory call to discuss enterprise consulting. Could you share your availability for a 30-minute discovery session next Tuesday or Wednesday?"
  },
  {
    name: "🛑 Lottery Scam (Spam Detection Test)",
    sender: "rewards-intl@instant-prizes-notify.com",
    subject: "CONGRATULATIONS: You have been selected to claim $1,000,000!",
    body: "Dear Beneficiary, Your email address was chosen in the Global Mega Sweepstakes. To claim your cash prize of $1,000,000 USD immediately, reply with your full bank account numbers, passport scan, and an administrative fee of $150."
  },
  {
    name: "📅 Meeting Reschedule",
    sender: "david.ross@acmepartners.com",
    subject: "Rescheduling our architecture sync",
    body: "Hi team, something came up on my calendar for our sync this afternoon. Would it be possible to push our meeting back by 2 hours, or reschedule to tomorrow morning? Let me know what works best."
  }
];

export default function SimulationModal({ isOpen, onClose, onRunSimulation, isSimulating }) {
  const [form, setForm] = useState(SIMULATION_PRESETS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onRunSimulation(form);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            <span>Test Inbound Email (Simulation)</span>
          </div>
          <button
            onClick={onClose}
            className="theme-toggle-btn"
            title="Close dialog"
            style={{ width: '22px', height: '22px' }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div>
              <span className="form-label">Presets</span>
              <div className="presets-list">
                {SIMULATION_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="preset-btn"
                    onClick={() => setForm(p)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="sim-sender">
                Sender Email
              </label>
              <input
                id="sim-sender"
                type="email"
                required
                className="form-input"
                value={form.sender}
                onChange={(e) => setForm({ ...form, sender: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" htmlFor="sim-subject">
                Subject Line
              </label>
              <input
                id="sim-subject"
                type="text"
                required
                className="form-input"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" htmlFor="sim-body">
                Email Body
              </label>
              <textarea
                id="sim-body"
                required
                rows={5}
                className="form-textarea"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose} disabled={isSimulating}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSimulating}>
              {isSimulating ? 'Processing Agent Pipeline...' : 'Run Simulation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
