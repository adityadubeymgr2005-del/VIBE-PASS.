import React, { useState } from 'react';
import { QrCode, Scan, Keyboard, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

export default function QrReader({ onScanSuccess }) {
  const [method, setMethod] = useState('input'); // input, camera
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { success: boolean, message: string, details: object }
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setScanResult(null);

    try {
      const response = await fetch('http://localhost:5000/api/checkin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ qrCodeVerifyCode: code.trim() })
      });

      const data = await response.json();
      
      if (response.ok) {
        setScanResult({
          success: true,
          message: data.message,
          details: {
            attendeeName: data.attendeeName,
            eventTitle: data.eventTitle,
            ticketQuantity: data.ticketQuantity,
            checkedInAt: data.checkedInAt
          }
        });
        setCode(''); // Clear code on success
        if (onScanSuccess) onScanSuccess();
      } else {
        setScanResult({
          success: false,
          message: data.message || 'Verification failed',
          details: data.attendeeName ? {
            attendeeName: data.attendeeName,
            eventTitle: data.eventTitle,
            ticketQuantity: data.ticketQuantity,
            checkedInAt: data.checkedInAt
          } : null
        });
      }
    } catch (err) {
      setScanResult({
        success: false,
        message: 'Network error communicating with check-in system.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Simulate scanning code via camera
  const handleSimulateCameraScan = () => {
    setScanning(true);
    setScanResult(null);

    // Simulate scan detection delay
    setTimeout(() => {
      setScanning(false);
      // Generate standard format uuid to trigger handleSubmit
      // The user can enter a real UUID code, or simulate by auto-fetching from testing ticket
      setCode('SIMULATED-SCAN-CODE-123');
      setMethod('input'); // Switch back to see code or autofill
    }, 1500);
  };

  return (
    <div className="qr-reader-container glass-panel">
      <div className="qr-reader-tabs">
        <button 
          className={`tab-btn ${method === 'input' ? 'active' : ''}`}
          onClick={() => setMethod('input')}
        >
          <Keyboard size={16} />
          <span>Manual Code Entry</span>
        </button>
        <button 
          className={`tab-btn ${method === 'camera' ? 'active' : ''}`}
          onClick={() => setMethod('camera')}
        >
          <Scan size={16} />
          <span>Simulate QR Camera</span>
        </button>
      </div>

      <div className="qr-reader-body">
        {method === 'input' ? (
          <form onSubmit={handleSubmit} className="manual-verify-form">
            <div className="form-group">
              <label className="form-label">Enter Ticket Verification UUID</label>
              <div className="input-with-icon">
                <QrCode size={18} className="input-icon" />
                <input 
                  type="text" 
                  className="form-input code-input"
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-full btn-verify"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spinner-icon-inline" />
                  <span>Verifying...</span>
                </>
              ) : (
                'Verify Ticket & Check-in'
              )}
            </button>
          </form>
        ) : (
          <div className="camera-scan-simulator">
            <div className="scanner-frame">
              <div className="scanner-line"></div>
              <div className="corner corner-tl"></div>
              <div className="corner corner-tr"></div>
              <div className="corner corner-bl"></div>
              <div className="corner corner-br"></div>
              
              {scanning ? (
                <div className="scanner-status-overlay">
                  <Loader2 size={32} className="spinner-icon-inline" />
                  <p>Searching for QR code...</p>
                </div>
              ) : (
                <div className="scanner-status-overlay">
                  <QrCode size={48} className="inactive-qr-icon" />
                  <p>Camera standby</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleSimulateCameraScan} 
              className="btn btn-secondary btn-full btn-simulate-scan"
              disabled={scanning}
            >
              {scanning ? 'Scanning...' : 'Trigger Scanner Simulation'}
            </button>
          </div>
        )}
      </div>

      {/* Result feedback */}
      {scanResult && (
        <div className={`scan-result-panel ${scanResult.success ? 'result-success' : 'result-failure'}`}>
          <div className="result-header">
            {scanResult.success ? (
              <ShieldCheck size={24} className="result-icon success" />
            ) : (
              <AlertTriangle size={24} className="result-icon failure" />
            )}
            <div>
              <h4 className="result-title">{scanResult.success ? 'Access Granted' : 'Access Denied'}</h4>
              <p className="result-msg">{scanResult.message}</p>
            </div>
          </div>

          {scanResult.details && (
            <div className="result-details">
              <div className="detail-item">
                <span className="detail-label">Attendee:</span>
                <span className="detail-value">{scanResult.details.attendeeName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Event:</span>
                <span className="detail-value">{scanResult.details.eventTitle}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tickets:</span>
                <span className="detail-value">{scanResult.details.ticketQuantity}</span>
              </div>
              {scanResult.details.checkedInAt && (
                <div className="detail-item">
                  <span className="detail-label">Scanned At:</span>
                  <span className="detail-value">
                    {new Date(scanResult.details.checkedInAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .qr-reader-container {
          max-width: 500px;
          margin: 0 auto;
        }

        .qr-reader-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.3rem;
          border-radius: var(--radius-md);
        }

        .qr-reader-body {
          margin-bottom: 1.5rem;
        }

        .input-with-icon {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .code-input {
          padding-left: 2.75rem !important;
          font-family: monospace;
          letter-spacing: 0.5px;
        }

        .btn-verify {
          margin-top: 1rem;
        }

        .spinner-icon-inline {
          animation: spin 1s infinite linear;
        }

        /* Camera Scanner Simulation Frame */
        .camera-scan-simulator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .scanner-frame {
          width: 100%;
          height: 250px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: var(--radius-md);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .scanner-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--secondary);
          box-shadow: 0 0 12px 2px var(--secondary);
          z-index: 10;
          animation: scannerSweep 2.5s infinite linear;
        }

        @keyframes scannerSweep {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }

        /* Frame Corners styling */
        .corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 3px solid var(--primary-hover);
        }

        .corner-tl { top: 15px; left: 15px; border-right: none; border-bottom: none; }
        .corner-tr { top: 15px; right: 15px; border-left: none; border-bottom: none; }
        .corner-bl { bottom: 15px; left: 15px; border-right: none; border-top: none; }
        .corner-br { bottom: 15px; right: 15px; border-left: none; border-top: none; }

        .scanner-status-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-muted);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .inactive-qr-icon {
          opacity: 0.25;
        }

        .scan-result-panel {
          padding: 1.25rem;
          border-radius: var(--radius-md);
          animation: scalePulse 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .result-success {
          background: rgba(0, 245, 212, 0.08);
          border: 1px solid rgba(0, 245, 212, 0.25);
        }

        .result-failure {
          background: rgba(255, 0, 84, 0.08);
          border: 1px solid rgba(255, 0, 84, 0.25);
        }

        .result-header {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .result-title {
          font-size: 1.1rem;
          margin-bottom: 0.15rem;
        }

        .result-success .result-title { color: var(--success); }
        .result-failure .result-title { color: var(--danger); }

        .result-msg {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .result-details {
          background: rgba(0, 0, 0, 0.2);
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }

        .detail-label {
          color: var(--text-muted);
        }

        .detail-value {
          color: #fff;
          font-weight: 600;
        }
      `}} />
    </div>
  );
}
