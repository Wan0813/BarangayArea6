import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import { useToast } from '../components/Toast';
import { dutyRoster } from '../api/endpoints';
import usePagedList from '../hooks/usePagedList';
import { DUTY_SHIFTS, errorMessage, formatDate, humanize, todayInputValue } from '../utils/format';

const INITIAL_FILTERS = { date: '' };

const EMPTY_FORM = {
  date: todayInputValue(),
  shift: 'Day',
  assignedDuty: '',
  area: '',
  position: '',
  personnelName: '',
  contactNumber: '',
  timeRange: '',
  isOnDuty: true,
  userId: '',
};

export default function DutyRoster() {
  const toast = useToast();
  const list = usePagedList(dutyRoster.list, { initialFilters: INITIAL_FILTERS });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, date: list.filters.date || todayInputValue() });
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      date: row.date ? String(row.date).slice(0, 10) : todayInputValue(),
      shift: row.shift || 'Day',
      assignedDuty: row.assignedDuty || '',
      area: row.area || '',
      position: row.position || '',
      personnelName: row.personnelName || '',
      contactNumber: row.contactNumber || '',
      timeRange: row.timeRange || '',
      isOnDuty: Boolean(row.isOnDuty),
      userId: row.userId ? String(row.userId) : '',
    });
    setFormOpen(true);
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!form.date) {
      toast.error('A date is required.');
      return;
    }
    if (!form.personnelName.trim()) {
      toast.error('Personnel name is required.');
      return;
    }

    const payload = {
      date: form.date,
      shift: form.shift,
      assignedDuty: form.assignedDuty,
      area: form.area,
      position: form.position,
      personnelName: form.personnelName.trim(),
      contactNumber: form.contactNumber,
      timeRange: form.timeRange,
      isOnDuty: form.isOnDuty,
      userId: form.userId ? Number(form.userId) : null,
    };

    setBusy(true);
    try {
      if (editing) {
        await dutyRoster.update(editing.id, payload);
        toast.success('Duty roster entry updated.');
      } else {
        await dutyRoster.create(payload);
        toast.success('Duty roster entry added.');
      }
      setFormOpen(false);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await dutyRoster.remove(deleteTarget.id);
      toast.success('Duty roster entry deleted.');
      setDeleteTarget(null);
      list.reloadAfterDelete();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  }

  const columns = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
    { key: 'shift', header: 'Shift', render: (row) => humanize(row.shift) },
    { key: 'assignedDuty', header: 'Assigned duty', render: (row) => <span className="cell-truncate">{row.assignedDuty || '—'}</span> },
    { key: 'area', header: 'Area', render: (row) => row.area || '—' },
    { key: 'position', header: 'Position', render: (row) => row.position || '—' },
    {
      key: 'personnelName',
      header: 'Personnel',
      render: (row) => (
        <span className="cell-stack">
          <strong>{row.personnelName || '—'}</strong>
          <small>{row.contactNumber || ''}</small>
        </span>
      ),
    },
    { key: 'timeRange', header: 'Time range', render: (row) => row.timeRange || '—' },
    {
      key: 'isOnDuty',
      header: 'On duty',
      render: (row) => (
        <span className={`badge ${row.isOnDuty ? 'badge-resolved' : 'badge-muted'}`}>
          {row.isOnDuty ? 'On duty' : 'Off'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => openEdit(row)}>
            Edit
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Duty Roster"
        subtitle="Who is on duty, where and when."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={list.reload} disabled={list.loading}>
              {list.loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + Add duty entry
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
        placeholder="Search by personnel, duty, area or position…"
        loading={list.loading}
      >
        <label className="filter">
          <span>Duty date</span>
          <input
            type="date"
            value={list.filters.date}
            onChange={(event) => list.setFilter('date', event.target.value)}
          />
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
        emptyTitle="No duty roster entries"
        emptyMessage="No entries match the selected date or search."
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
        title={editing ? `Edit duty entry #${editing.id}` : 'Add duty entry'}
        onClose={() => setFormOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="duty-form" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Add entry'}
            </button>
          </>
        }
      >
        <form id="duty-form" onSubmit={submitForm}>
          <div className="form-grid">
            <FormField label="Date" htmlFor="dr-date" required>
              <input
                id="dr-date"
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              />
            </FormField>

            <FormField label="Shift" htmlFor="dr-shift" required>
              <select
                id="dr-shift"
                value={form.shift}
                onChange={(event) => setForm((prev) => ({ ...prev, shift: event.target.value }))}
              >
                {DUTY_SHIFTS.map((shift) => (
                  <option key={shift} value={shift}>
                    {humanize(shift)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Assigned duty" htmlFor="dr-duty" className="span-2">
              <input
                id="dr-duty"
                type="text"
                value={form.assignedDuty}
                onChange={(event) => setForm((prev) => ({ ...prev, assignedDuty: event.target.value }))}
              />
            </FormField>

            <FormField label="Area" htmlFor="dr-area">
              <input
                id="dr-area"
                type="text"
                value={form.area}
                onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
              />
            </FormField>

            <FormField label="Position" htmlFor="dr-position">
              <input
                id="dr-position"
                type="text"
                value={form.position}
                onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
              />
            </FormField>

            <FormField label="Personnel name" htmlFor="dr-name" required>
              <input
                id="dr-name"
                type="text"
                value={form.personnelName}
                onChange={(event) => setForm((prev) => ({ ...prev, personnelName: event.target.value }))}
              />
            </FormField>

            <FormField label="Contact number" htmlFor="dr-contact">
              <input
                id="dr-contact"
                type="tel"
                value={form.contactNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, contactNumber: event.target.value }))}
              />
            </FormField>

            <FormField label="Time range" htmlFor="dr-time" hint="e.g. 8:00 AM – 5:00 PM">
              <input
                id="dr-time"
                type="text"
                value={form.timeRange}
                onChange={(event) => setForm((prev) => ({ ...prev, timeRange: event.target.value }))}
              />
            </FormField>

            <FormField label="Linked staff account ID (optional)" htmlFor="dr-user" hint="Numeric user id, if this entry belongs to a staff account.">
              <input
                id="dr-user"
                type="number"
                value={form.userId}
                onChange={(event) => setForm((prev) => ({ ...prev, userId: event.target.value }))}
              />
            </FormField>

            <FormField label="" className="checkbox-field">
              <label htmlFor="dr-onduty">
                <input
                  id="dr-onduty"
                  type="checkbox"
                  checked={form.isOnDuty}
                  onChange={(event) => setForm((prev) => ({ ...prev, isOnDuty: event.target.checked }))}
                />
                Currently on duty
              </label>
            </FormField>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete duty entry"
        message={
          deleteTarget
            ? `Delete the duty entry for ${deleteTarget.personnelName} on ${formatDate(deleteTarget.date)}?`
            : ''
        }
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
