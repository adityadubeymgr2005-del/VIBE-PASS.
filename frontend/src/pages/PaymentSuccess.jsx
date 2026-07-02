import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiUrl } from '../api';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Confirming your payment and booking...');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      setStatus('error');
      setMessage('Missing payment session. Please return to the event page and try again.');
      return;
    }

    const confirmBooking = async () => {
      try {
        const res = await fetch(apiUrl('/api/payments/confirm-booking'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ sessionId })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Payment confirmation failed');
        }

        setStatus('success');
        setMessage('Your booking is confirmed! Redirecting you to My Bookings...');
        setTimeout(() => {
          navigate('/my-bookings');
        }, 3000);
      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage(err.message || 'Could not confirm your payment.');
      }
    };

    confirmBooking();
  }, [location.search, navigate]);

  return (
    <div className="payment-success-page glass-panel">
      {status === 'loading' && (
        <>
          <Loader2 size={48} className="spinner-icon" />
          <h2>Finalizing your booking...</h2>
          <p>{message}</p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle size={64} className="success-icon" />
          <h2>Booking Confirmed</h2>
          <p>{message}</p>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle size={64} className="error-icon" />
          <h2>Payment Confirmation Failed</h2>
          <p>{message}</p>
          <button className="btn btn-secondary mt-2" onClick={() => navigate('/')}>Return Home</button>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .payment-success-page {
          min-height: calc(100vh - 160px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
          gap: 1.25rem;
          color: #fff;
        }

        .spinner-icon {
          animation: spin 1s linear infinite;
          color: var(--secondary);
        }

        .success-icon {
          color: var(--success);
        }

        .error-icon {
          color: var(--danger);
        }

        h2 {
          margin: 0;
          font-size: 2rem;
        }

        p {
          color: var(--text-muted);
          max-width: 520px;
          line-height: 1.7;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
