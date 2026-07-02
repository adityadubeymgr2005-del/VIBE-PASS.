import React, { useState } from 'react';
import { CreditCard, Wallet, Smartphone, Landmark, CheckCircle, Loader2 } from 'lucide-react';
import { apiUrl } from '../api';

export default function PaymentModal({ isOpen, onClose, amount, eventId, ticketQuantity, onPaymentSuccess }) {
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState('card'); // upi, card, netbanking
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Form states
  const [cardNo, setCardNo] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bank, setBank] = useState('chase');

  const handleStripeCheckout = async () => {
    setProcessing(true);
    setPaymentError('');

    try {
      const res = await fetch(apiUrl('/api/payments/create-checkout-session'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ eventId, ticketQuantity })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Could not create checkout session');
      }
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      setPaymentError(err.message || 'Unable to start Stripe checkout.');
      setProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'card') {
      return handleStripeCheckout();
    }

    setProcessing(true);
    setPaymentError('');

    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess({
          method: paymentMethod,
          amount: amount,
          transactionId: 'TXN-' + Math.floor(Math.random() * 1000000000)
        });
      }, 1500);
    }, 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel payment-modal-box">
        {success ? (
          <div className="payment-success-view">
            <div className="success-icon-container">
              <CheckCircle size={64} className="success-check-icon" />
            </div>
            <h2>Payment Successful!</h2>
            <p>Your tickets have been issued and confirmed.</p>
            <p className="amount-label">₹{amount.toFixed(2)} Paid</p>
          </div>
        ) : processing ? (
          <div className="payment-processing-view">
            <Loader2 size={48} className="spinner-icon" />
            <h2>Verifying Transaction...</h2>
            <p>Please do not close this modal or refresh the page.</p>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h3>Secure Checkout</h3>
              <button className="close-modal-btn" onClick={onClose}>&times;</button>
            </div>
            
            <div className="checkout-summary">
              <span className="summary-label">Total Amount:</span>
              <span className="summary-amount">₹{amount.toFixed(2)}</span>
            </div>

            <div className="payment-methods-tabs">
              <button 
                type="button"
                className={`tab-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <Smartphone size={16} />
                <span>UPI</span>
              </button>
              <button 
                type="button"
                className={`tab-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard size={16} />
                <span>Card</span>
              </button>
              <button 
                type="button"
                className={`tab-btn ${paymentMethod === 'netbanking' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('netbanking')}
              >
                <Landmark size={16} />
                <span>Net Banking</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="payment-form">
              {paymentMethod === 'upi' && (
                <div className="upi-form-content">
                  <div className="upi-qr-mock">
                    {/* Simulated UPI Scan QR */}
                    <div className="qr-box">
                      <img 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=simulate_upi_payment" 
                        alt="Simulated UPI QR" 
                        className="qr-img"
                      />
                      <div className="qr-scan-lens"></div>
                    </div>
                    <p className="qr-instructions">Scan this QR Code using any UPI App (GPay, PhonePe, Paytm) to pay</p>
                  </div>
                  
                  <div className="or-divider"><span>OR</span></div>

                  <div className="form-group">
                    <label className="form-label">Enter UPI ID</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="username@okaxis" 
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required={paymentMethod === 'upi' && !upiId}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="card-form-content">
                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="4111 2222 3333 4444" 
                      maxLength="19"
                      value={cardNo}
                      onChange={(e) => setCardNo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group half-width">
                      <label className="form-label">Expiry Date</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="MM/YY" 
                        maxLength="5"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group half-width">
                      <label className="form-label">CVV</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="123" 
                        maxLength="3"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="netbanking-form-content">
                  <div className="form-group">
                    <label className="form-label">Select Your Bank</label>
                    <select 
                      className="form-select"
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      required
                    >
                      <option value="chase">Chase Bank</option>
                      <option value="bofa">Bank of America</option>
                      <option value="wells">Wells Fargo</option>
                      <option value="citi">Citi Bank</option>
                      <option value="hsbc">HSBC</option>
                    </select>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full btn-checkout-submit" disabled={processing}>
                {paymentMethod === 'card' ? `Pay with Card ₹${amount.toFixed(2)}` : `Pay ₹${amount.toFixed(2)}`}
              </button>
            </form>
            {paymentError && <p className="payment-error">{paymentError}</p>}
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .payment-modal-box {
          max-width: 480px !important;
          border-color: var(--primary) !important;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 0.75rem;
        }

        .modal-header h3 {
          margin: 0;
          color: #fff;
        }

        .close-modal-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.8rem;
          cursor: pointer;
          transition: var(--transition);
          line-height: 1;
        }

        .close-modal-btn:hover {
          color: var(--accent);
        }

        .checkout-summary {
          background: rgba(131, 56, 236, 0.1);
          border: 1px dashed var(--border-glass-hover);
          padding: 1rem;
          border-radius: var(--radius-md);
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .summary-label {
          color: var(--text-muted);
          font-weight: 500;
        }

        .summary-amount {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--secondary);
        }

        .payment-methods-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.3rem;
          border-radius: var(--radius-md);
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 0.6rem 0;
          font-family: var(--font-family);
          font-weight: 600;
          font-size: 0.85rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition);
        }

        .tab-btn.active {
          background: var(--bg-secondary);
          color: var(--secondary);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .half-width {
          flex: 1;
        }

        .upi-form-content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .upi-qr-mock {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1rem;
        }

        .qr-box {
          background: white;
          padding: 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 0.75rem;
          position: relative;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        .qr-img {
          display: block;
          width: 150px;
          height: 150px;
        }

        .qr-scan-lens {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--secondary);
          box-shadow: 0 0 10px var(--secondary);
          animation: scan 2s infinite linear;
        }

        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }

        .qr-instructions {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-align: center;
          max-width: 250px;
        }

        .or-divider {
          width: 100%;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          line-height: 0.1em;
          margin: 1rem 0 1.5rem 0;
        }

        .or-divider span {
          background: var(--bg-secondary);
          padding: 0 10px;
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .btn-checkout-submit {
          margin-top: 1.5rem;
        }

        .payment-processing-view, .payment-success-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 0;
          text-align: center;
        }

        .spinner-icon {
          color: var(--primary-hover);
          animation: spin 1s infinite linear;
          margin-bottom: 1.5rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .payment-processing-view h2, .payment-success-view h2 {
          margin-bottom: 0.5rem;
          color: #fff;
        }

        .payment-processing-view p, .payment-success-view p {
          color: var(--text-muted);
        }

        .success-icon-container {
          background: rgba(0, 245, 212, 0.1);
          padding: 1.5rem;
          border-radius: 50%;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(0, 245, 212, 0.2);
          animation: scalePulse 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes scalePulse {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .payment-error {
          margin-top: 1rem;
          color: var(--danger);
          font-size: 0.95rem;
          text-align: center;
        }

        .success-check-icon {
          color: var(--success);
        }

        .amount-label {
          margin-top: 1rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--secondary) !important;
        }
      `}} />
    </div>
  );
}
