import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { account, DEV_MODE } from '../config/appwrite';
import './Login.css';

export function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user, checkSession, mockLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle Appwrite callback
    const secret = searchParams.get('secret');
    const userId = searchParams.get('userId');

    if (secret && userId) {
      handleCallback(secret, userId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleCallback = async (secret: string, userId: string) => {
    if (DEV_MODE) {
      return;
    }

    try {
      setLoading(true);
      await account!.createSession(userId, secret);
      await checkSession();
      navigate('/');
    } catch (error) {
      console.error('Failed to verify session:', error);
      setError('Kunne ikke verifisere innlogging. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Vennligst skriv inn en e-postadresse');
      return;
    }

    try {
      setLoading(true);
      await account!.createMagicURLToken({
        userId: 'unique()',
        email,
        url: `${window.location.origin}/auth/callback`,
      });
      setMessage('En magisk lenke er sendt til din e-postadresse. Sjekk innboksen din og klikk på lenken for å logge inn.');
      setEmail('');
    } catch (error: any) {
      console.error('Failed to send magic link:', error);
      setError(error.message || 'Kunne ikke sende magisk lenke. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockLogin = async () => {
    try {
      setLoading(true);
      await mockLogin();
      navigate('/');
    } catch (error: any) {
      setError(error.message || 'Kunne ikke logge inn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="font-display-bold-24">Logg inn</h1>
        <p className="font-regular-16 login-description">
          Skriv inn din e-postadresse for å motta en magisk lenke for innlogging.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-postadresse"
            className="login-input font-regular-16"
            disabled={loading || DEV_MODE}
            autoFocus={!DEV_MODE}
          />

          {error && <div className="login-error font-regular-14">{error}</div>}
          {message && <div className="login-message font-regular-14">{message}</div>}

          {!DEV_MODE && (
            <button
              type="submit"
              disabled={loading}
              className="login-button font-display-semibold-16"
            >
              {loading ? 'Sender...' : 'Send magisk lenke'}
            </button>
          )}

          {DEV_MODE && (
            <>
              <button
                type="button"
                onClick={handleMockLogin}
                disabled={loading}
                className="login-button login-button-dev font-display-semibold-16"
              >
                {loading ? 'Logger inn...' : '🔧 Dev: Logg inn som testbruker'}
              </button>
              <p className="font-regular-14" style={{ marginTop: '12px', opacity: 0.7, textAlign: 'center' }}>
                Dev-modus aktivert - Appwrite er deaktivert
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

