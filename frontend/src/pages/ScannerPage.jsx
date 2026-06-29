import React, { useState } from 'react';
import { QrCode, Users, CheckCircle, RefreshCw } from 'lucide-react';
import QrReader from '../components/QrReader';

export default function ScannerPage() {
  const [recentScans, setRecentScans] = useState([]);

  const handleScanSuccess = () => {
    // When a scan completes, we can trigger a sound or fetch recent arrivals if backend kept history
    // Since we'll let QrReader handle the submission, we can keep track of scans in session memory:
    // We fetch details from localStorage or we can poll. For now, QrReader will notify us, and we
    // will just refresh or add it. To make it dynamic, we'll let the user enter and see a local checklist!
  };

  return (
    <div className="scanner-page-container">
      <div className="scanner-layout">
        {/* Scanner Panel */}
        <div className="scanner-main-section">
          <div className="scanner-header-text">
            <h2>Access Validation Station</h2>
            <p>Scan user QR passes or key in verification IDs to validate admission tickets.</p>
          </div>
          
          <QrReader onScanSuccess={handleScanSuccess} />
        </div>

        {/* Info & Arrival Panel */}
        <div className="scanner-sidebar-section glass-panel">
          <div className="sidebar-header">
            <Users size={20} className="brand-accent" />
            <h3>Check-in Instructions</h3>
          </div>
          
          <div className="instruction-points">
            <div className="point-item">
              <span className="point-num">1</span>
              <p>Ask the attendee to open their ticket on their mobile device or provide their printout.</p>
            </div>
            <div className="point-item">
              <span className="point-num">2</span>
              <p>Align their QR Code within the camera frame or type the unique Ticket UUID from their ticket details.</p>
            </div>
            <div className="point-item">
              <span className="point-num">3</span>
              <p>The system will verify the ticket in real-time, checking for double entry and organizer authority.</p>
            </div>
            <div className="point-item">
              <span className="point-num">4</span>
              <p>Green banner indicates success. Red banner signals a duplicate entry or unrecognized ticket ID.</p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scanner-page-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .scanner-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2rem;
        }

        .scanner-main-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .scanner-header-text {
          margin-bottom: 0.5rem;
        }

        .scanner-header-text h2 {
          color: #fff;
          margin-bottom: 0.25rem;
        }

        .scanner-header-text p {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        /* Sidebar info style */
        .scanner-sidebar-section {
          height: fit-content;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 0.5rem;
        }

        .sidebar-header h3 {
          margin: 0;
          color: #fff;
          font-size: 1.1rem;
        }

        .instruction-points {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .point-item {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .point-num {
          background: rgba(131, 56, 236, 0.15);
          color: var(--secondary);
          border: 1px solid var(--border-glass-hover);
          font-weight: 700;
          font-size: 0.8rem;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 0.15rem;
        }

        .point-item p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        @media (max-width: 900px) {
          .scanner-layout {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </div>
  );
}
