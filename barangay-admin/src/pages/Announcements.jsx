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
import { announcements } from '../api/endpoints';
import { resolveFileUrl } from '../api/client';
import usePagedList from '../hooks/usePagedList';
import { errorMessage, formatDateTime, truncate } from '../utils/format';

const INITIAL_FILTERS = {};

const EMPTY_FORM = { title: '', body: '', isPublished: true };

export default function Announcements() {
  const { isAdmin, isHeadAdmin } = useAuth();
  const toast = useToast();
  const list = usePagedList(announcements.list, { initialFilters: INITIAL_FILTERS });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);

  const [detail, setDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImage(null);
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      title: row.title || '',
      body: row.body || '',
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
    if (!form.body.trim()) {
      toast.error('The announcement body is required.');
      return;
    }

    const payload = { title: form.title.trim(), body: form.body, isPublished: form.isPublished };

    setBusy(true);
    try {
      if (editing) {
        await announcements.update(editing.id, payload, image);
        toast.success('Announcement updated.');
      } else {
        await announcements.create(payload, image);
        toast.success('Announcement posted.');
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
      await announcements.publish(row.id, !row.isPublished);
      toast.success(row.isPublished ? 'Announcement unpublished.' : 'Announcement published.');
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await announcements.remove(deleteTarget.id);
      toast.success('Announcement deleted.');
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
      key: 'title',
      header: 'Title',
      render: (row) => (
        <span className="cell-stack">
          <strong>{truncate(row.title, 60)}</strong>
          <small>{truncate(row.body, 80)}</small>
        </span>
      ),
    },
    { key: 'createdAt', header: 'Created', render: (row) => formatDateTime(row.createdAt) },
    { key: 'author', header: 'Posted by', render: (row) => row.createdByName || row.authorName || '—' },
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
            </>
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
        title="Announcements"
        subtitle="Public posts shown on the barangay website and mobile app."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={list.reload} disabled={list.loading}>
              {list.loading ? 'Refreshing…' : 'Refresh'}
            </button>
            {isAdmin ? (
              <button type="button" className="btn btn-primary" onClick={openCreate}>
                + New announcement
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
        placeholder="Search announcements by title or body…"
        loading={list.loading}
      />

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
        emptyTitle="No announcements"
        emptyMessage="Nothing matches the current search."
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
        title={editing ? `Edit announcement #${editing.id}` : 'New announcement'}
        onClose={() => setFormOpen(false)}
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="announcement-form" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Post announcement'}
            </button>
          </>
        }
      >
        <form id="announcement-form" onSubmit={submitForm}>
          <FormField label="Title" htmlFor="an-title" required>
            <input
              id="an-title"
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
          </FormField>

          <FormField label="Body" htmlFor="an-body" required>
            <textarea
              id="an-body"
              rows={7}
              value={form.body}
              onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
            />
          </FormField>

          <FormField label="" className="checkbox-field">
            <label htmlFor="an-published">
              <input
                id="an-published"
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))}
              />
              Publish immediately
            </label>
          </FormField>

          <ImageUpload label="Image (optional)" value={image} existingUrl={editing?.imageUrl} onChange={setImage} />
        </form>
      </Modal>

      <Modal open={Boolean(detail)} title={detail ? detail.title : ''} onClose={() => setDetail(null)} size="md">
        {detail ? (
          <>
            <p className="muted small">
              {detail.createdByName || detail.authorName || 'Barangay office'} ·{' '}
              {formatDateTime(detail.createdAt)} · {detail.isPublished ? 'Published' : 'Draft'}
            </p>
            {detail.imageUrl ? (
              <img className="lightbox-image" src={resolveFileUrl(detail.imageUrl)} alt="Announcement" />
            ) : null}
            <p className="comment-body">{detail.body}</p>
          </>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete announcement"
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
