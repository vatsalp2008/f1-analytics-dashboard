import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const KeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'Space', action: 'Play/Pause replay' },
    { key: 'Left Arrow', action: 'Seek back 5 seconds' },
    { key: 'Right Arrow', action: 'Seek forward 5 seconds' },
    { key: 'R', action: 'Restart session' },
    { key: 'M', action: 'Toggle mute' },
    { key: 'F', action: 'Toggle fullscreen' },
    { key: 'H', action: 'Show this help' },
    { key: 'Esc', action: 'Close modal' },
  ];

  return (
    <>
      <button
        className="help-button"
        onClick={() => setIsOpen(true)}
        title="Keyboard shortcuts"
      >
        <HelpCircle size={20} />
      </button>

      {isOpen && (
        <div className="shortcuts-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Keyboard Shortcuts</h2>
              <button
                className="close-button"
                onClick={() => setIsOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="shortcuts-grid">
              {shortcuts.map((shortcut, i) => (
                <div key={i} className="shortcut-item rise-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <kbd className="shortcut-key">{shortcut.key}</kbd>
                  <span className="shortcut-action">{shortcut.action}</span>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <p>Use these shortcuts to navigate and control the replay engine faster.</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .help-button {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--accent-red);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(225, 6, 0, 0.3);
          transition: all 0.2s;
          z-index: 999;
        }

        .help-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(225, 6, 0, 0.4);
        }

        .help-button:active {
          transform: scale(0.95);
        }

        .shortcuts-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .shortcuts-modal {
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(45, 45, 60, 0.95) 100%);
          border: 1px solid rgba(225, 6, 0, 0.3);
          border-radius: 12px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(225, 6, 0, 0.2);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .close-button {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(225, 6, 0, 0.15);
          border: 1px solid rgba(225, 6, 0, 0.3);
          color: var(--accent-red);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: rgba(225, 6, 0, 0.25);
        }

        .shortcuts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .shortcut-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(225, 6, 0, 0.15);
          border-radius: 8px;
          transition: all 0.2s;
        }

        .shortcut-item:hover {
          background: rgba(225, 6, 0, 0.1);
          transform: translateY(-2px);
        }

        .shortcut-key {
          display: inline-block;
          background: rgba(225, 6, 0, 0.2);
          border: 1px solid rgba(225, 6, 0, 0.3);
          color: var(--accent-red);
          padding: 0.4rem 0.6rem;
          border-radius: 4px;
          font-family: monospace;
          font-weight: 700;
          font-size: 0.85rem;
          white-space: nowrap;
        }

        .shortcut-action {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .modal-footer {
          padding-top: 1rem;
          border-top: 1px solid rgba(225, 6, 0, 0.15);
          text-align: center;
        }

        .modal-footer p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      `}</style>
    </>
  );
};

export default KeyboardShortcuts;
