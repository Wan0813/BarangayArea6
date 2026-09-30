import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import { useToast } from '../components/Toast';
import { users } from '../api/endpoints';
import usePagedList from '../hooks/usePagedList';
import { ROLE_LABELS, errorMessage, formatDate } from '../utils/format';

const INITIAL_FILTERS = { role: '' };

const EMPTY_FORM = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  position: '',
  contactNumber: '',
  address: '',
  role: 'Admin',
};

export default function Staff() {
  const toast = useToast();
  const list = usePagedList(users.list, { initialFilters: INITIAL_FILTERS });

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const [positionTarget, setPositionTarget] = useState(null);
  const [positionValue, setPositionValue] = useState('');
  const [positionBusy, setPositionBusy] = useState(false);

  const [roleTarget, setRoleTarget] = useState(null);
  const [roleForm, setRoleForm] = useState({ role: 'Admin', position: '' });
  const [roleBusy, setRoleBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.username.trim() || !form.email.trim() || !form.password) {
      toast.error('Full name, username, email and password are required.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('The password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      await users.create({
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        position: form.position,
        contactNumber: form.contactNumber,
        address: form.address,
        role: form.role,
      });
      toast.success('Staff account created.');
      setFormOpen(false);
      setForm(EMPTY_FORM);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitPosition(event) {
    event.preventDefault();
    if (!positionTarget) return;
    setPositionBusy(true);
    try {
      await users.setPosition(positionTarget.id, { position: positionValue });
      toast.success('Position updated.');
      setPositionTarget(null);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPositionBusy(false);
    }
  }

  async function submitRole(event) {
    event.preventDefault();
    if (!roleTarget) return;
    setRoleBusy(true);
    try {
      await users.setRole(roleTarget.id, { role: roleForm.role, position: roleForm.position });
      toast.success('Role updated.');
      setRoleTarget(null);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setRoleBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await users.remove(deleteTarget.id);
      toast.success(`Removed ${deleteTarget.username}.`);
      setDeleteTarget(null);
      list.reloadAfterDelete();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  }

  const columns = [
    {
      key: 'user',
      header: 'Staff member',
      render: (row) => (
        <span className="cell-stack">
          <strong>{row.fullName || row.username}</strong>
          <small>@{row.username}</small>
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <span className="cell-stack">
          <small>{row.email || '—'}</small>
          <small>{row.contactNumber || '—'}</small>
        </span>
      ),
    },
    { key: 'position', header: 'Position', render: (row) => row.position || '—' },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <span className={`badge badge-${(row.role || '').toLowerCase() === 'headadmin' ? 'head-admin' : (row.role || '').toLowerCase()}`}>
          {ROLE_LABELS[row.role] || row.role}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'createdAt', header: 'Added', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setPositionTarget(row);
              setPositionValue(row.position || '');
            }}
          >
            Set position
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setRoleTarget(row);
              setRoleForm({ role: row.role || 'Admin', position: row.position || '' });
            }}
          >
            Change role
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(row)}>
            Remove
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle="Head Admin only — create and manage barangay staff accounts."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={list.reload} disabled={list.loading}>
              {list.loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + New staff account
            </button>
          </>
        }
      />

      <SearchBar
        search={list.search}
        onSearchChange={list.setSearch}
        onSubmit={list.submitSearch}
        onReset={list.reset}
        initialFilters={INITIAL_FILTERS}
        placeholder="Search staff by username, name, email or address…"
        loading={list.loading}
      >
        <label className="filter">
          <span>Role</span>
          <select value={list.filters.role} onChange={(event) => list.setFilter('role', event.target.value)}>
            <option value="">All staff roles</option>
            <option value="Admin">Admin</option>
            <option value="HeadAdmin">Head Admin</option>
          </select>
        </label>
      </SearchBar>

      {list.error ? (
        <div className="error-banner">
          <span>{list.error}</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={list.reload}>
            Retry
          </button>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        emptyTitle="No staff accounts"
        emptyMessage="No staff accounts match the current search or filters."
      />

      <Pagination
        page={list.page}
        totalPages={list.meta.totalPages}
        totalItems={list.meta.totalItems}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onPageSizeChange={(size) => {
          list.setPageSize(size);
          list.setPage(1);
        }}
        disabled={list.loading}
      />

      <Modal
        open={formOpen}
        title="New staff account"
        onClose={() => setFormOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="staff-form" className="btn btn-primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </>
        }
      >
        <form id="staff-form" onSubmit={submitForm}>
          <div className="form-grid">
            <FormField label="Full name" htmlFor="st-name" required>
              <input
                id="st-name"
                type="text"
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              />
            </FormField>

            <FormField label="Username" htmlFor="st-user" required>
              <input
                id="st-user"
                type="text"
                value={form.username}
                onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              />
            </FormField>

            <FormField label="Email" htmlFor="st-email" required>
              <input
                id="st-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </FormField>

            <FormField label="Temporary password" htmlFor="st-pass" required hint="At least 6 characters.">
              <input
                id="st-pass"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              />
            </FormField>

            <FormField label="Position" htmlFor="st-position" hint="e.g. Barangay Secretary, Tanod.">
              <input
                id="st-position"
                type="text"
                value={form.position}
                onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
              />
            </FormField>

            <FormField label="Role" htmlFor="st-role" required>
              <select
                id="st-role"
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              >
                <option value="Admin">Admin</option>
                <option value="HeadAdmin">Head Admin</option>
              </select>
            </FormField>

            <FormField label="Contact number" htmlFor="st-contact">
              <input
                id="st-contact"
                type="tel"
                value={form.contactNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, contactNumber: event.target.value }))}
              />
            </FormField>

            <FormField label="Address" htmlFor="st-address" className="span-2">
              <textarea
                id="st-address"
                rows={2}
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </FormField>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(positionTarget)}
        title={positionTarget ? `Position — ${positionTarget.username}` : ''}
        onClose={() => setPositionTarget(null)}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setPositionTarget(null)} disabled={positionBusy}>
              Cancel
            </button>
            <button type="submit" form="staff-position-form" className="btn btn-primary" disabled={positionBusy}>
              {positionBusy ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="staff-position-form" onSubmit={submitPosition}>
          <FormField label="Position" htmlFor="stp-position">
            <input
              id="stp-position"
              type="text"
              value={positionValue}
              onChange={(event) => setPositionValue(event.target.value)}
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        open={Boolean(roleTarget)}
        title={roleTarget ? `Role — ${roleTarget.username}` : ''}
        onClose={() => setRoleTarget(null)}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setRoleTarget(null)} disabled={roleBusy}>
              Cancel
            </button>
            <button type="submit" form="staff-role-form" className="btn btn-primary" disabled={roleBusy}>
              {roleBusy ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="staff-role-form" onSubmit={submitRole}>
          <FormField label="Role" htmlFor="str-role" required>
            <select
              id="str-role"
              value={roleForm.role}
              onChange={(event) => setRoleForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="Admin">Admin</option>
              <option value="HeadAdmin">Head Admin</option>
              <option value="Resident">Resident</option>
            </select>
          </FormField>
          <FormField label="Position" htmlFor="str-position">
            <input
              id="str-position"
              type="text"
              value={roleForm.position}
              onChange={(event) => setRoleForm((prev) => ({ ...prev, position: event.target.value }))}
            />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove staff account"
        message={deleteTarget ? `Remove the staff account "${deleteTarget.username}"? This cannot be undone.` : ''}
        confirmLabel="Remove"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
