import { RoleBadge, StatusBadge } from '../common/UserBadges';

// User accounts table, styled after ProductsTable.jsx (same header/skeleton/
// empty-state pattern) so the Administration screen reads as part of the
// same catalog/inventory/reports family rather than a bolted-on screen.

function formatDate(value) {
  if (!value) return '--';
  try {
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '--';
  }
}

function TableSkeleton() {
  return (
    <tbody className="divide-y divide-surface-container">
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="py-3 px-4" colSpan={7}>
            <div className="h-8 bg-surface-container rounded" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export default function UsersTable({ users, isLoading, isError, errorMessage, currentUserId, onEdit, onToggleStatus }) {
  return (
    <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
      {isError && (
        <div className="flex items-center gap-space-sm p-space-md bg-error-container/40 border-b border-error/30 text-on-error-container">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span className="font-body-sm text-body-sm">{errorMessage}</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-headline-sm text-[11px] uppercase tracking-wider select-none">
              <th className="py-3.5 px-4 font-semibold">User</th>
              <th className="py-3.5 px-3 font-semibold">Contact</th>
              <th className="py-3.5 px-3 font-semibold text-center">Role</th>
              <th className="py-3.5 px-3 font-semibold text-center">Status</th>
              <th className="py-3.5 px-3 font-semibold">Created</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <tbody className="divide-y divide-surface-container font-body-sm text-body-sm text-on-surface">
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                const isActive = u.status === 'active';
                const disableBlocked = isSelf && isActive;
                return (
                  <tr key={u.id} className={`transition-colors ${isActive ? 'hover:bg-surface-container-low' : 'opacity-70'}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary shrink-0">
                          <span className="material-symbols-outlined text-[18px]">badge</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate flex items-center gap-1.5">
                            {u.full_name || u.username}
                            {isSelf && (
                              <span className="font-label-code text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold uppercase">
                                You
                              </span>
                            )}
                          </span>
                          <span className="font-label-code text-label-code text-on-surface-variant truncate">@{u.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-on-surface-variant">
                      <div className="flex flex-col">
                        <span className="truncate max-w-[200px]">{u.email || '--'}</span>
                        <span className="font-label-code text-label-code">{u.phone || ''}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3 px-3 text-on-surface-variant">{formatDate(u.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(u)}
                          title="Edit user"
                          className="p-1.5 rounded-lg text-primary hover:bg-surface-container"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => !disableBlocked && onToggleStatus(u)}
                          disabled={disableBlocked}
                          title={
                            disableBlocked
                              ? "You can't disable your own account from this screen."
                              : isActive
                              ? 'Disable user'
                              : 'Re-enable user'
                          }
                          className={`p-1.5 rounded-lg disabled:text-outline disabled:cursor-not-allowed ${
                            isActive ? 'text-error hover:bg-error-container/50' : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isActive ? 'block' : 'check_circle'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {!isLoading && users.length === 0 && !isError && (
        <div className="flex flex-col items-center justify-center gap-space-sm py-16 text-center">
          <span className="material-symbols-outlined text-outline text-[40px]">person_off</span>
          <p className="font-body-md text-body-md text-on-surface-variant">No user accounts found.</p>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="px-space-md py-3 bg-surface-container-low flex flex-wrap items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
          <span>
            Displaying {users.length} {users.length === 1 ? 'account' : 'accounts'}
          </span>
        </div>
      )}
    </div>
  );
}
