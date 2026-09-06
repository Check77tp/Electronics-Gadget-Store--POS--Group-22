import apiClient from './client';

// Increment 4 (Administration / User Management) API wrappers, same
// thin-wrapper-over-axios pattern as products.js / reports.js. Field names
// are copied verbatim from API_REFERENCE.md's "## Users (`/api/users`) --
// admin only" section (UserCreateRequest / UserUpdateRequest). All of these
// 403 server-side for non-admins; UserManagementPage never fires them unless
// hasRole('admin') is true, but a stray direct call still gets a graceful
// 403 handled by the caller, per the API reference's "hide the button, still
// handle the 403" philosophy.

export async function fetchUsers() {
  const res = await apiClient.get('/api/users');
  return res.data; // UserPublic[]
}

export async function createUser(payload) {
  // payload matches UserCreateRequest verbatim: username, password, full_name,
  // email?, phone?, role
  const res = await apiClient.post('/api/users', payload);
  return res.data; // UserPublic
}

export async function updateUser(userId, payload) {
  // payload matches UserUpdateRequest (all fields optional): full_name, email,
  // phone, role, status, password
  const res = await apiClient.put(`/api/users/${userId}`, payload);
  return res.data; // UserPublic
}

export async function disableUser(userId) {
  // Shortcut for PUT { status: 'disabled' }. 400 if it's the last active admin.
  const res = await apiClient.post(`/api/users/${userId}/disable`);
  return res.data; // UserPublic
}

export async function enableUser(userId) {
  // No dedicated "enable" endpoint -- PUT with status: 'active' per the API
  // reference ("PUT ... status: 'active'|'disabled'").
  const res = await apiClient.put(`/api/users/${userId}`, { status: 'active' });
  return res.data; // UserPublic
}
