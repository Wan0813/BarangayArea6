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
import { emergencies } from '../api/endpoints';
import { resolveFileUrl } from '../api/client';
import usePagedList from '../hooks/usePagedList';
import useStaffList from '../hooks/useStaffList';
import { EMERGENCY_STATUSES, errorMessage, formatDate, formatDateTime, truncate } from '../utils/format';

const INITIAL_FILTERS = { status: '' };

export default function Emergencies() {
  const { isAdmin, isHeadAdmin } = useAuth();
  const toast = useToast();
  const { staff } = useStaffList();

  const list = usePagedList(emergencies.list, { initialFilters: INITIAL_FILTERS });

  const [detail, setDetail] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'Pending', response: '', eta: '', assignedOfficerId: '' });
  const [statusBusy, setStatusBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function openStatusModal(row) {
    setStatusTarget(row);
    setStatusForm({
      status: row.status || 'Pending',
      response: row.response || '',
      eta: row.eta || '',
      assignedOfficerId: row.assignedOfficerId ? String(row.assignedOfficerId) : '',
    });
  }

  async function submitStatus(event) {
    event.preventDefault();
    if (!statusTarget) return;
    setStatusBusy(true);
    try {
      await emergencies.setStatus(statusTarget.id, {
        status: statusForm.status,
        response: statusForm.response,
        eta: statusForm.eta,
        assignedOfficerId: statusForm.assignedOfficerId ? Number(statusForm.assignedOfficerId) : null,
      });
      toast.success(`Emergency #${statusTarget.id} updated.`);
      setStatusTarget(null);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setStatusBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await emergencies.remove(deleteTarget.id);
      toast.success(`Emergency #${deleteTarget.id} deleted.`);
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
      key: 'reporter',
      header: 'Reported by',
      render: (row) => (
        <span className="cell-stack">
          <strong>{row.reporterUsername || row.contactNumber || '—'}</strong>
          <small>{row.reporterFullName || ''}</small>
        </span>
      ),
    },
    { key: 'kind', header: 'Kind', render: (row) => row.kind || row.type || '—' },
    { key: 'location', header: 'Location', render: (row) => <span className="cell-truncate">{row.location || '—'}</span> },
    {
      key: 'description',
      header: 'Details',
      render: (row) => <span className="cell-truncate">{truncate(row.description, 70) || '—'}</span>,
    },
    { key: 'createdAt', header: 'Reported', render: (row) => formatDate(row.createdAt) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'eta', header: 'ETA', render: (row) => row.eta || '—' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDetail(row)}>
            View
          </button>
          {isAdmin ? (
            <button type="button" className="btn btn-sm btn-primary" onClick={() => openStatusModal(row)}>
              Update status
            </button>
          ) : null}
          {isHeadAdmin ? (
            <button type="button" className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(row)}>
              Delete
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Emergencies"
        subtitle="Respond to emergency reports and keep residents informed."
        actions={
          <button type="button" className="btn btn-ghost" onClick={list.reload} disabled={list.loading}>
            {list.loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      <SearchBar
        search={list.search}
        onSearchChange={list.setSearch}
        onSubmit={list.submitSearch}
        onReset={list.reset}
        initialFilters={INITIAL_FILTERS}
        placeholder="Search by reporter, location or details…"
        loading={list.loading}
      >
        <label className="filter">
          <span>Status</span>
          <select value={list.filters.status} onChange={(event) => list.setFilter('status', event.target.value)}>
            <option value="">All statuses</option>
            {EMERGENCY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
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
        emptyTitle="No emergency reports"
        emptyMessage="No emergency reports match the current search or filters."
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

      <Modal open={Boolean(detail)} title={detail ? `Emergency #${detail.id}` : ''} onClose={() => setDetail(null)} size="lg">
        {detail ? (
          <>
            <dl className="detail-list">
              <dt>Kind</dt>
              <dd>{detail.kind || detail.type || '—'}</dd>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={detail.status} />
              </dd>
              <dt>Location</dt>
              <dd>{detail.location || '—'}</dd>
              <dt>Contact number</dt>
              <dd>{detail.contactNumber || '—'}</dd>
              <dt>Reported by</dt>
              <dd>{detail.reporterUsername || '—'}</dd>
              <dt>Reported at</dt>
              <dd>{formatDateTime(detail.createdAt)}</dd>
              <dt>Assigned officer</dt>
              <dd>{detail.assignedOfficerName || 'Unassigned'}</dd>
              <dt>Arriving within</dt>
              <dd>{detail.eta || '—'}</dd>
              <dt>Description</dt>
              <dd className="comment-body">{detail.description || '—'}</dd>
              <dt>Response</dt>
              <dd className="comment-body">{detail.response || 'No response recorded yet.'}</dd>
            </dl>
            {detail.imageUrl ? (
              <img className="lightbox-image" src={resolveFileUrl(detail.imageUrl)} alt="Emergency attachment" />
            ) : null}
          </>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(statusTarget)}
        title={statusTarget ? `Update emergency #${statusTarget.id}` : ''}
        onClose={() => setStatusTarget(null)}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setStatusTarget(null)} disabled={statusBusy}>
              Cancel
            </button>
            <button type="submit" form="emergency-status-form" className="btn btn-primary" disabled={statusBusy}>
              {statusBusy ? 'Saving…' : 'Save update'}
            </button>
          </>
        }
      >
        <form id="emergency-status-form" onSubmit={submitStatus}>
          <FormField label="Status" htmlFor="es-status" required>
            <select
              id="es-status"
              value={statusForm.status}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              {EMERGENCY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Response" htmlFor="es-response">
            <textarea
              id="es-response"
              rows={4}
              value={statusForm.response}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, response: event.target.value }))}
            />
          </FormField>

          <FormField label="Arriving within (ETA)" htmlFor="es-eta" hint="e.g. 10 minutes, 1 hour">
            <input
              id="es-eta"
              type="text"
              value={statusForm.eta}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, eta: event.target.value }))}
            />
          </FormField>

          <FormField label="Assigned officer" htmlFor="es-officer">
            <select
              id="es-officer"
              value={statusForm.assignedOfficerId}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, assignedOfficerId: event.target.value }))}
            >
              <option value="">Unassigned</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName || member.username}
                  {member.position ? ` — ${member.position}` : ''}
                </option>
              ))}
            </select>
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete emergency report"
        message={deleteTarget ? `Delete emergency report #${deleteTarget.id}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
