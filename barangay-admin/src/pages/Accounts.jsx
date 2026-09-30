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
import { useAuth } from '../context/AuthContext';
import { users } from '../api/endpoints';
import { resolveFileUrl } from '../api/client';
import usePagedList from '../hooks/usePagedList';
import { ACCOUNT_STATUSES, ROLE_LABELS, errorMessage, formatDate, truncate } from '../utils/format';

const INITIAL_FILTERS = { status: '', role: '' };

export default function Accounts() {
  const { isHeadAdmin } = useAuth();
  const toast = useToast();
  const list = usePagedList(users.list, { initialFilters: INITIAL_FILTERS });

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'Active', remarks: '', householdId: '' });
  const [statusBusy, setStatusBusy] = useState(false);

  const [roleTarget, setRoleTarget] = useState(null);
  const [roleForm, setRoleForm] = useState({ role: 'Resident', position: '' });
  const [roleBusy, setRoleBusy] = useState(false);

  const [idPreview, setIdPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [detail, setDetail] = useState(null);

  function openStatus(row, status) {
    setStatusTarget(row);
    setStatusForm({ status, remarks: row.statusRemarks || '', householdId: row.householdId ? String(row.householdId) : '' });
  }

  function openRole(row) {
    setRoleTarget(row);
    setRoleForm({ role: row.role || 'Resident', position: row.position || '' });
  }

  async function submitStatus(event) {
    event.preventDefault();
    if (!statusTarget) return;
    setStatusBusy(true);
    try {
      await users.setStatus(statusTarget.id, {
        status: statusForm.status,
        remarks: statusForm.remarks,
        householdId: statusForm.householdId ? Number(statusForm.householdId) : null,
      });
      toast.success(`${statusTarget.username} is now ${statusForm.status}.`);
      setStatusTarget(null);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setStatusBusy(false);
    }
  }

  async function submitRole(event) {
    event.preventDefault();
    if (!roleTarget) return;
    setRoleBusy(true);
    try {
      await users.setRole(roleTarget.id, { role: roleForm.role, position: roleForm.position });
      toast.success(`${roleTarget.username} updated.`);
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
      toast.success(`Account ${deleteTarget.username} deleted.`);
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
      header: 'Account',
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
    {
      key: 'address',
      header: 'Address',
      render: (row) => <span className="cell-truncate">{truncate(row.address, 50) || '—'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <span className="cell-stack">
          <span className={`badge badge-${(row.role || '').toLowerCase() === 'headadmin' ? 'head-admin' : (row.role || '').toLowerCase()}`}>
            {ROLE_LABELS[row.role] || row.role || '—'}
          </span>
          <small>{row.position || '—'}</small>
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'validId',
      header: 'Valid ID',
      render: (row) =>
        row.validIdImageUrl ? (
          <button type="button" className="thumb-btn" onClick={() => setIdPreview(row)} title="Click to enlarge">
            <img src={resolveFileUrl(row.validIdImageUrl)} alt={`${row.username} valid ID`} />
          </button>
        ) : (
          <span className="muted small">{row.validIdType || '—'}</span>
        ),
    },
    { key: 'createdAt', header: 'Registered', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDetail(row)}>
            View
          </button>

          {isHeadAdmin ? (
            <>
              {row.status !== 'Active' ? (
                <button type="button" className="btn btn-sm btn-primary" onClick={() => openStatus(row, 'Active')}>
                  Approve
                </button>
              ) : null}
              {row.status !== 'Declined' ? (
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => openStatus(row, 'Declined')}>
                  Decline
                </button>
              ) : null}
              {row.status !== 'Suspended' && row.status === 'Active' ? (
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => openStatus(row, 'Suspended')}>
                  Suspend
                </button>
              ) : null}
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => openRole(row)}>
                Role / position
              </button>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(row)}>
                Delete
              </button>
            </>
          ) : (
            <span className="muted small">Head Admin only</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle="Approve sign-ups, manage roles and review submitted valid IDs."
        actions={
          <button type="button" className="btn btn-ghost" onClick={list.reload} disabled={list.loading}>
            {list.loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      {!isHeadAdmin ? (
        <div className="note">
          You can browse accounts, but approving, declining, suspending, changing roles and deleting are
          limited to <strong>Head Admin</strong> accounts.
        </div>
      ) : null}

      <SearchBar
        search={list.search}
        onSearchChange={list.setSearch}
        onSubmit={list.submitSearch}
        onReset={list.reset}
        initialFilters={INITIAL_FILTERS}
        placeholder="Search by username, name, email or address…"
        loading={list.loading}
      >
        <label className="filter">
          <span>Status</span>
          <select value={list.filters.status} onChange={(event) => list.setFilter('status', event.target.value)}>
            <option value="">All statuses</option>
            {ACCOUNT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="filter">
          <span>Role</span>
          <select value={list.filters.role} onChange={(event) => list.setFilter('role', event.target.value)}>
            <option value="">All roles</option>
            <option value="Resident">Resident</option>
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
        emptyTitle="No accounts found"
        emptyMessage="No accounts match the current search or filters."
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

      {/* --------------------------- account detail ------------------------ */}
      <Modal open={Boolean(detail)} title={detail ? `Account: ${detail.username}` : ''} onClose={() => setDetail(null)} size="md">
        {detail ? (
          <>
            <dl className="detail-list">
              <dt>Full name</dt>
              <dd>{detail.fullName || '—'}</dd>
              <dt>Username</dt>
              <dd>{detail.username}</dd>
              <dt>Email</dt>
              <dd>{detail.email || '—'}</dd>
              <dt>Contact</dt>
              <dd>{detail.contactNumber || '—'}</dd>
              <dt>Age</dt>
              <dd>{detail.age ?? '—'}</dd>
              <dt>Address</dt>
              <dd>{detail.address || '—'}</dd>
              <dt>Role</dt>
              <dd>{ROLE_LABELS[detail.role] || detail.role}</dd>
              <dt>Position</dt>
              <dd>{detail.position || '—'}</dd>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={detail.status} />
              </dd>
              <dt>Status remarks</dt>
              <dd>{detail.statusRemarks || '—'}</dd>
              <dt>Valid ID type</dt>
              <dd>{detail.validIdType || '—'}</dd>
              <dt>Household</dt>
              <dd>{detail.householdNumber || '—'}</dd>
              <dt>Registered</dt>
              <dd>{formatDate(detail.createdAt)}</dd>
              <dt>Last login</dt>
              <dd>{detail.lastLoginAt ? formatDate(detail.lastLoginAt) : '—'}</dd>
            </dl>
            {detail.validIdImageUrl ? (
              <FormField label="Submitted valid ID">
                <button type="button" className="thumb-btn" onClick={() => setIdPreview(detail)}>
                  <img src={resolveFileUrl(detail.validIdImageUrl)} alt="Valid ID" />
                </button>
              </FormField>
            ) : null}
          </>
        ) : null}
      </Modal>

      {/* ---------------------------- status modal ------------------------- */}
      <Modal
        open={Boolean(statusTarget)}
        title={statusTarget ? `Set status for ${statusTarget.username}` : ''}
        onClose={() => setStatusTarget(null)}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setStatusTarget(null)} disabled={statusBusy}>
              Cancel
            </button>
            <button type="submit" form="account-status-form" className="btn btn-primary" disabled={statusBusy}>
              {statusBusy ? 'Saving…' : 'Save status'}
            </button>
          </>
        }
      >
        <form id="account-status-form" onSubmit={submitStatus}>
          <FormField label="Status" htmlFor="ac-status" required>
            <select
              id="ac-status"
              value={statusForm.status}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              {ACCOUNT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Remarks" htmlFor="ac-remarks" hint="Optional note explaining the decision.">
            <textarea
              id="ac-remarks"
              rows={3}
              value={statusForm.remarks}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, remarks: event.target.value }))}
            />
          </FormField>

          {statusForm.status === 'Active' ? (
            <FormField
              label="Attach to household (optional)"
              htmlFor="ac-household"
              hint="Household id — residents can be linked to an existing household when approved."
            >
              <input
                id="ac-household"
                type="number"
                value={statusForm.householdId}
                onChange={(event) => setStatusForm((prev) => ({ ...prev, householdId: event.target.value }))}
              />
            </FormField>
          ) : null}
        </form>
      </Modal>

      {/* ----------------------------- role modal -------------------------- */}
      <Modal
        open={Boolean(roleTarget)}
        title={roleTarget ? `Role & position: ${roleTarget.username}` : ''}
        onClose={() => setRoleTarget(null)}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setRoleTarget(null)} disabled={roleBusy}>
              Cancel
            </button>
            <button type="submit" form="account-role-form" className="btn btn-primary" disabled={roleBusy}>
              {roleBusy ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="account-role-form" onSubmit={submitRole}>
          <FormField label="Role" htmlFor="ac-role" required hint="Resident (app user) or Admin / Head Admin (staff).">
            <select
              id="ac-role"
              value={roleForm.role}
              onChange={(event) => setRoleForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="Resident">Resident</option>
              <option value="Admin">Admin</option>
              <option value="HeadAdmin">Head Admin</option>
            </select>
          </FormField>

          <FormField label="Position" htmlFor="ac-position" hint="Shown on the org chart / roster, e.g. Barangay Secretary.">
            <input
              id="ac-position"
              type="text"
              value={roleForm.position}
              onChange={(event) => setRoleForm((prev) => ({ ...prev, position: event.target.value }))}
            />
          </FormField>
        </form>
      </Modal>

      {/* ---------------------------- valid ID zoom ------------------------ */}
      <Modal open={Boolean(idPreview)} title={idPreview ? `Valid ID — ${idPreview.username}` : ''} onClose={() => setIdPreview(null)} size="lg">
        {idPreview ? (
          <>
            <p className="muted small">{idPreview.validIdType || 'ID type not recorded'}</p>
            <img className="lightbox-image" src={resolveFileUrl(idPreview.validIdImageUrl)} alt="Valid ID" />
          </>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete account"
        message={deleteTarget ? `Permanently delete the account "${deleteTarget.username}"? This cannot be undone.` : ''}
        confirmLabel="Delete account"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
