import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/layout/Logo';

// From-scratch Login screen (no Stitch export exists for this one — see
// claude/README.md Section 10). Built with precision_retail_core.md's tokens:
// deep navy branding panel (inverse-surface), sapphire primary action,
// Hanken Grotesk body copy, JetBrains Mono for the terminal/build label,
// consistent with the other screens' aesthetic.
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null); // { message, tone: 'error' | 'warning' }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  function validate() {
    const errors = {};
    if (!username.trim()) errors.username = 'Username is required.';
    if (!password) errors.password = 'Password is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await login(username.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(redirectTo, { replace: true });
      return;
    }

    if (result.status === 403) {
      setFormError({ message: result.message || 'This account has been disabled. Contact an administrator.', tone: 'warning' });
    } else if (result.status === 401) {
      setFormError({ message: result.message || 'Incorrect username or password.', tone: 'error' });
    } else {
      setFormError({ message: result.message, tone: 'error' });
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-background font-body-md text-on-surface antialiased">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-inverse-surface text-inverse-on-surface flex-col justify-between p-space-3xl">
        <div className="flex items-center gap-space-sm">
          <Logo className="h-9 w-auto" />
        </div>
        <div className="flex flex-col gap-space-md max-w-md">
          <span className="font-label-code text-label-code text-primary-fixed-dim uppercase tracking-wider">Terminal OS</span>
          <h1 className="font-display-lg text-display-lg text-surface-container-lowest">
            Precision retail, from the counter up.
          </h1>
          <p className="font-body-lg text-body-lg text-inverse-on-surface/80">
            Search, scan, sell. GadgetPOS keeps checkout, stock, and reporting in one
            place for the whole electronics floor.
          </p>
        </div>
        <div className="flex items-center gap-space-xs text-inverse-on-surface/60">
          <span className="material-symbols-outlined text-[16px]">verified_user</span>
          <span className="font-label-code text-label-code">CSC4630 &middot; Unified Process Build</span>
        </div>
      </div>

      {/* Login form panel */}
      <div className="flex flex-1 items-center justify-center p-space-lg">
        <div className="w-full max-w-sm flex flex-col gap-space-xl">
          <div className="flex lg:hidden items-center gap-space-sm justify-center mb-space-md">
            <Logo className="h-8 w-auto" />
          </div>

          <div className="flex flex-col gap-space-xs">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Sign in</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Enter your GadgetPOS credentials to open a register session.
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className={
                formError.tone === 'warning'
                  ? 'flex items-start gap-space-sm p-space-md rounded-lg bg-amber-50 border border-amber-200 text-amber-800'
                  : 'flex items-start gap-space-sm p-space-md rounded-lg bg-error-container/40 border border-error/30 text-on-error-container'
              }
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">
                {formError.tone === 'warning' ? 'block' : 'error'}
              </span>
              <span className="font-body-sm text-body-sm">{formError.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <label htmlFor="username" className="font-body-sm text-body-sm font-semibold text-on-surface">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md outline-none border transition-colors focus:ring-2 focus:ring-primary/40 ${
                  fieldErrors.username ? 'border-error' : 'border-outline-variant focus:border-primary'
                }`}
                placeholder="e.g. cashier"
              />
              {fieldErrors.username && (
                <span className="font-body-sm text-body-sm text-error">{fieldErrors.username}</span>
              )}
            </div>

            <div className="flex flex-col gap-space-xs">
              <label htmlFor="password" className="font-body-sm text-body-sm font-semibold text-on-surface">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md outline-none border transition-colors focus:ring-2 focus:ring-primary/40 ${
                  fieldErrors.password ? 'border-error' : 'border-outline-variant focus:border-primary'
                }`}
                placeholder="Enter your password"
              />
              {fieldErrors.password && (
                <span className="font-body-sm text-body-sm text-error">{fieldErrors.password}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-primary-container text-on-primary font-body-md text-body-md font-semibold flex items-center justify-center gap-space-sm hover:bg-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-on-primary/40 border-t-on-primary animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          <p className="font-label-code text-label-code text-outline text-center">
            GadgetPOS &middot; Electronics &amp; Gadgets Store POS
          </p>
        </div>
      </div>
    </div>
  );
}
