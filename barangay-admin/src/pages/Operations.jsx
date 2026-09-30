import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import ImageUpload from '../components/ImageUpload';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { operations } from '../api/endpoints';
import { resolveFileUrl } from '../api/client';
import usePagedList from '../hooks/usePagedList';
import useStaffList from '../hooks/useStaffList';
import {
  OPERATION_CATEGORIES,
  errorMessage,
  formatDate,
  humanize,
  toDateInputValue,
  todayInputValue,
  truncate,
} from '../utils/format';

const INITIAL_FILTERS = { category: '', published: '' };

const EMPTY_FORM = {
  date: todayInputValue(),
  title: '',
  details: '',
  category: OPERATION_CATEGORIES[0],
  assignedOfficerId: '',
  assignedStaffId: '',
  personnelInvolved: '',
  isPublished: true,
};

export default function Operations() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const { staff } = useStaffList();

  const list = usePagedList(operations.list, { initialFilters: INITIAL_FILTERS });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [detail, setDetail] = useState(null);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, date: todayInputValue() });
    setImage(null);
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      date: toDateInputValue(row.date) || todayInputValue(),
      title: row.title || '',
      details: row.details || '',
      category: row.category || OPERATION_CATEGORIES[0],
      assignedOfficerId: row.assignedOfficerId ? String(row.assignedOfficerId) : '',
      assignedStaffId: row.assignedStaffId ? String(row.assignedStaffId) : '',
      personnelInvolved: row.personnelInvolved || '',
      isPublished: Boolean(row.isPublished),
    });
    setImage(null);
    setFormOpen(true);
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error('A title is required.');
      return;
    }
    if (!form.date) {
      toast.error('A date is required.');
      return;
    }

    const payload = {
      date: form.date,
      title: form.title.trim(),
      details: form.details,
      category: form.category,
      assignedOfficerId: form.assignedOfficerId || '',
      assignedStaffId: form.assignedStaffId || '',
      personnelInvolved: form.personnelInvolved,
      isPublished: form.isPublished,
    };

    setBusy(true);
    try {
      if (editing) {
        await operations.update(editing.id, payload, image);
        toast.success('Daily operation updated.');
      } else {
        await operations.create(payload, image);
        toast.success('Daily operation created.');
      }
      setFormOpen(false);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(row) {
    try {
      await operations.publish(row.id, !row.isPublished);
      toast.success(row.isPublished ? 'Unpublished.' : 'Published.');
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await operations.remove(deleteTarget.id);
      toast.success('Daily operation deleted.');
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
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <span className="cell-stack">
          <strong>{truncate(row.title, 55)}</strong>
          <small>{truncate(row.details, 65)}</small>
        </span>
      ),
    },
    { key: 'category', header: 'Category', render: (row) => humanize(row.category) },
    {
      key: 'assignedOfficerName',
      header: 'Assigned',
      render: (row) => (
        <span className="cell-stack">
          <small>Officer: {row.assignedOfficerName || '—'}</small>
          <small>Staff: {row.assignedStaffName || '—'}</small>
        </span>
      ),
    },
    {
      key: 'personnelInvolved',
      header: 'Personnel',
      render: (row) => <span className="cell-truncate">{truncate(row.personnelInvolved, 40) || '—'}</span>,
    },
    {
      key: 'isPublished',
      header: 'Visibility',
      render: (row) => (
        <span className={`badge ${row.isPublished ? 'badge-resolved' : 'badge-pending'}`}>
          {row.isPublished ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDetail(row)}>
            View
          </button>
          {isAdmin ? (
            <>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => openEdit(row)}>
                Edit
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => togglePublish(row)}>
                {row.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(row)}>
                Delete
              </button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Daily Operations"
        subtitle="Day-to-day barangay activities, assignments and published daily logs."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={list.reload} disabled={list.loading}>
              {list.loading ? 'Refreshing…' : 'Refresh'}
            </button>
            {isAdmin ? (
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                + New daily operation
              </button>
            ) : null}
          </>
        }
      />

      <SearchBar
        search={list.search}
        onSearchChange={list.setSearch}
        onSubmit={list.submitSearch}
        onReset={list.reset}
        initialFilters={INITIAL_FILTERS}
        placeholder="Search by title, details, category or assigned personnel…"
        loading={list.loading}
      >
        <label className="filter">
          <span>Category</span>
          <select value={list.filters.category} onChange={(event) => list.setFilter('category', event.target.value)}>
            <option value="">All categories</option>
            {OPERATION_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {humanize(category)}
              </option>
            ))}
          </select>
        </label>

        <label className="filter">
          <span>Visibility</span>
          <select value={list.filters.published} onChange={(event) => list.setFilter('published', event.target.value)}>
            <option value="">All</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
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
        emptyTitle="No daily operations"
        emptyMessage="Nothing matches the current search or filters."
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
        title={editing ? `Edit daily operation #${editing.id}` : 'New daily operation'}
        onClose={() => setFormOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="operation-form" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create'}
            </button>
          </>
        }
      >
        <form id="operation-form" onSubmit={submitForm}>
          <div className="form-grid">
            <FormField label="Date" htmlFor="op-date" required>
              <input
                id="op-date"
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              />
            </FormField>

            <FormField label="Category" htmlFor="op-category" required>
              <select
                id="op-category"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              >
                {OPERATION_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {humanize(category)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Title" htmlFor="op-title" required className="span-2">
              <input
                id="op-title"
                type="text"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </FormField>

            <FormField label="Details" htmlFor="op-details" className="span-2">
              <textarea
                id="op-details"
                rows={4}
                value={form.details}
                onChange={(event) => setForm((prev) => ({ ...prev, details: event.target.value }))}
              />
            </FormField>

            <FormField label="Assigned officer" htmlFor="op-officer">
              <select
                id="op-officer"
                value={form.assignedOfficerId}
                onChange={(event) => setForm((prev) => ({ ...prev, assignedOfficerId: event.target.value }))}
              >
                <option value="">None</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName || member.username}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Assigned staff" htmlFor="op-staff">
              <select
                id="op-staff"
                value={form.assignedStaffId}
                onChange={(event) => setForm((prev) => ({ ...prev, assignedStaffId: event.target.value }))}
              >
                <option value="">None</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName || member.username}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Personnel involved"
              htmlFor="op-personnel"
              className="span-2"
              hint="Free text — separate names with commas."
            >
              <input
                id="op-personnel"
                type="text"
                value={form.personnelInvolved}
                onChange={(event) => setForm((prev) => ({ ...prev, personnelInvolved: event.target.value }))}
              />
            </FormField>

            <FormField label="" className="checkbox-field">
              <label htmlFor="op-published">
                <input
                  id="op-published"
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
                />
                Publish this daily log
              </label>
            </FormField>

            <ImageUpload label="Photo (optional)" value={image} existingUrl={editing?.imageUrl} onChange={setImage} />
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(detail)} title={detail ? detail.title : ''} onClose={() => setDetail(null)} size="md">
        {detail ? (
          <>
            <dl className="detail-list">
              <dt>Date</dt>
              <dd>{formatDate(detail.date)}</dd>
              <dt>Category</dt>
              <dd>{humanize(detail.category)}</dd>
              <dt>Status</dt>
              <dd>{detail.isPublished ? 'Published' : 'Draft'}</dd>
              <dt>Assigned officer</dt>
              <dd>{detail.assignedOfficerName || '—'}</dd>
              <dt>Assigned staff</dt>
              <dd>{detail.assignedStaffName || '—'}</dd>
              <dt>Personnel involved</dt>
              <dd>{detail.personnelInvolved || '—'}</dd>
              <dt>Created by</dt>
              <dd>{detail.createdByName || '—'}</dd>
              <dt>Details</dt>
              <dd className="comment-body">{detail.details || '—'}</dd>
            </dl>
            {detail.imageUrl ? (
              <img className="lightbox-image" src={resolveFileUrl(detail.imageUrl)} alt="Daily operation" />
            ) : null}
          </>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete daily operation"
        message={deleteTarget ? `Delete "${deleteTarget.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
