import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { getErrorMessage } from '../../api/client';

// Add/Edit User modal for the Administration screen (Increment 4). No Stitch
// export exists for this screen, so the structure is deliberately modeled on
// ProductFormModal.jsx (single-panel form + header/body/footer, same Modal
// wrapper, same input/label classes) for visual consistency rather than
// inventing a new layout paradigm.
//
// `user` is null for Add, or a UserPublic for Edit. Create sends the full
// UserCreateRequest shape (username, password, full_name, email?, phone?,
// role); Edit sends UserUpdateRequest (full_name, email, phone, role,
// password?) -- username can't be changed (not in UserUpdateRequest per
// API_REFERENCE.md) and status is managed from the table's Enable/Disable
// action, not this form.

const ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'cashier', label: 'Cashier' },
];

const MIN_PASSWORD_LENGTH = 8;

function emptyForm() {
  return {
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'cashier',
  };
}

function formFromUser(user) {
  return {
    username: user.username || '',
    password: '',
    full_name: user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'cashier',
  };
}

export default function UserFormModal({ open, onClose, user, onSubmit }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState(emptyForm());
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(user ? formFromUser(user) : emptyForm());
      setShowPassword(false);
      setFieldErrors({});
      setSubmitError(null);
    }
  }, [open, user]);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }

  function validate() {
    const errors = {};
    if (!isEdit && !form.username.trim()) errors.username = 'Username is required.';
    if (!form.full_name.trim()) errors.full_name = 'Full name is required.';
    if (!isEdit && !form.password) {
      errors.password = 'Password is required.';
    } else if (form.password && form.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const payload = {
          full_name: form.full_name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          role: form.role,
        };
        // Blank password on edit means "don't change" -- only send it if the
        // admin actually typed a new one.
        if (form.password) payload.password = form.password;
        await onSubmit(payload);
      } else {
        await onSubmit({
          username: form.username.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          role: form.role,
        });
      }
      // onSubmit resolving means the caller already closed the modal on success.
    } catch (err) {
      const message = getErrorMessage(err, 'Could not save this user.');
      if (/username/i.test(message)) {
        setFieldErrors((prev) => ({ ...prev, username: message }));
      }
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputBase =
    'w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none disabled:opacity-60 disabled:cursor-not-allowed';
  const labelBase = 'font-headline-sm text-headline-sm font-semibold text-on-surface';

  return (
    <Modal open={open} onClose={onClose} maxWidthClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-space-xl py-space-md bg-surface-container-low flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[22px]">{isEdit ? 'manage_accounts' : 'person_add'}</span>
            </div>
            <div className="min-w-0">
              <span className="font-headline-md text-headline-md font-semibold text-on-surface truncate block">
                {isEdit ? 'Edit User' : 'Add New User'}
              </span>
              {isEdit && (
                <p className="font-label-code text-label-code text-on-surface-variant truncate">@{user.username}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-space-xl overflow-y-auto flex-1 space-y-space-lg">
          {submitError && (
            <div className="flex items-center gap-space-sm p-space-md rounded-lg bg-error-container/40 border border-error/30 text-on-error-container">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span className="font-body-sm text-body-sm">{submitError}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className={labelBase}>
              Username {!isEdit && <span className="text-error">*</span>}
            </label>
            <input
              className={`${inputBase} font-label-code text-label-code`}
              type="text"
              value={form.username}
              disabled={isEdit}
              onChange={(e) => setField('username', e.target.value)}
              placeholder="jdoe"
              autoComplete="off"
            />
            {isEdit && (
              <span className="font-body-sm text-body-sm text-on-surface-variant">Usernames can't be changed once created.</span>
            )}
            {fieldErrors.username && <span className="font-body-sm text-body-sm text-error">{fieldErrors.username}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelBase}>
              Full Name <span className="text-error">*</span>
            </label>
            <input
              className={inputBase}
              type="text"
              value={form.full_name}
              onChange={(e) => setField('full_name', e.target.value)}
              placeholder="Jane Doe"
            />
            {fieldErrors.full_name && <span className="font-body-sm text-body-sm text-error">{fieldErrors.full_name}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label className={labelBase}>Email</label>
              <input
                className={inputBase}
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="jane@gadgetpos.test"
              />
              {fieldErrors.email && <span className="font-body-sm text-body-sm text-error">{fieldErrors.email}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelBase}>Phone</label>
              <input
                className={inputBase}
                type="text"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="(555) 010-1234"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelBase}>
              {isEdit ? 'New Password' : 'Password'} {!isEdit && <span className="text-error">*</span>}
            </label>
            <div className="relative flex items-center">
              <input
                className={`${inputBase} pr-11`}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                placeholder={isEdit ? 'Leave blank to keep current password' : `At least ${MIN_PASSWORD_LENGTH} characters`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"
              >
                <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {fieldErrors.password && <span className="font-body-sm text-body-sm text-error">{fieldErrors.password}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelBase}>
              Role <span className="text-error">*</span>
            </label>
            <select
              className={`${inputBase} cursor-pointer`}
              value={form.role}
              onChange={(e) => setField('role', e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-space-xl py-space-md bg-surface-container-low flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[18px] text-primary">info</span>
            <span>Fields marked * are required</span>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container shadow-xs font-body-sm text-body-sm font-semibold transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary shadow-md font-headline-sm text-headline-sm font-semibold transition-all disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">{isSubmitting ? 'sync' : 'save'}</span>
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
