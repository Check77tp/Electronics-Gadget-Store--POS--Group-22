import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { fetchUsers, createUser, updateUser, disableUser, enableUser } from '../api/users';
import UsersTable from '../components/users/UsersTable';
import UserFormModal from '../components/users/UserFormModal';
import Toast from '../components/pos/Toast';

// Administration / User Management screen (Increment 4), admin-only per
// API_REFERENCE.md ("## Users (`/api/users`) -- admin only"). No Stitch
// export exists for this screen (per the task brief), so it's built from
// scratch against the same design tokens and structural pattern as
// ProductsPage.jsx (table + add/edit modal + row actions with confirm
// dialogs) for visual consistency.
//
// Gated behind hasRole('admin') at the page level -- a manager or cashier
// who lands on /users directly sees a clean "not authorized" message and the
// query never fires, mirroring ReportsPage.jsx's admin/manager gate.

export default function UserManagementPage() {
  const { user: currentUser, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const queryClient = useQueryClient();

  const [toast, setToast] = useState(null);
  const [modalState, setModalState] = useState({ open: false, user: null });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: isAdmin,
  });

  function showToast(message, icon = 'check_circle') {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 2800);
  }

  function invalidateUsers() {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }

  function openAddModal() {
    setModalState({ open: true, user: null });
  }

  function openEditModal(user) {
    setModalState({ open: true, user });
  }

  function closeModal() {
    setModalState({ open: false, user: null });
  }

  async function handleFormSubmit(payload) {
    if (modalState.user) {
      await updateUser(modalState.user.id, payload);
      showToast(`${payload.full_name} updated`, 'check_circle');
    } else {
      await createUser(payload);
      showToast(`${payload.full_name} added as a new ${payload.role}`, 'person_add');
    }
    invalidateUsers();
    closeModal();
  }

  async function handleToggleStatus(user) {
    const isActive = user.status === 'active';
    if (isActive && user.id === currentUser?.id) {
      // Client-side guard only -- the backend also blocks this (and the
      // last-active-admin case below), this just avoids a round trip for
      // the always-blocked case of an admin disabling themself.
      showToast("You can't disable your own account from this screen.", 'block');
      return;
    }
    const confirmMessage = isActive
      ? `Disable "${user.full_name}"? They will no longer be able to sign in.`
      : `Re-enable "${user.full_name}"? They will be able to sign in again.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      if (isActive) {
        await disableUser(user.id);
        showToast(`${user.full_name} disabled`, 'block');
      } else {
        await enableUser(user.id);
        showToast(`${user.full_name} re-enabled`, 'check_circle');
      }
      invalidateUsers();
    } catch (err) {
      if (err?.response?.status === 403) {
        showToast('You do not have permission to change user accounts.', 'block');
        return;
      }
      // Surfaces the backend's "cannot disable the last remaining
      // administrator" 400 (and any other business-rule 400) cleanly instead
      // of crashing.
      showToast(getErrorMessage(err, 'Could not update this user.'), 'error');
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-space-md p-space-2xl min-h-[calc(100vh-4rem)]">
        <span className="material-symbols-outlined text-outline text-[48px]">lock</span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Not Authorized</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md text-center">
          User Management is available to Administrators only. If you believe you should have access, contact your
          store administrator.
        </p>
      </div>
    );
  }

  const users = usersQuery.data || [];

  return (
    <div className="flex flex-col w-full relative">
      {/* Top Utility Bar */}
      <section className="px-space-xl pt-space-lg pb-space-md bg-surface-container-low flex flex-col gap-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
            </div>
            <div>
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-md text-headline-md text-on-surface">User Management</span>
                <span className="font-label-code text-label-code px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-semibold">
                  {usersQuery.isLoading ? '...' : `${users.length} account${users.length === 1 ? '' : 's'}`}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Manage staff accounts, roles, and access to GadgetPOS.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="font-body-md text-body-md font-semibold">+ Add New User</span>
            </button>
          </div>
        </div>
      </section>

      <section className="p-space-xl">
        <UsersTable
          users={users}
          isLoading={usersQuery.isLoading}
          isError={usersQuery.isError}
          errorMessage={getErrorMessage(usersQuery.error, 'Could not load user accounts.')}
          currentUserId={currentUser?.id}
          onEdit={openEditModal}
          onToggleStatus={handleToggleStatus}
        />
      </section>

      <UserFormModal open={modalState.open} onClose={closeModal} user={modalState.user} onSubmit={handleFormSubmit} />

      <Toast toast={toast} />
    </div>
  );
}
