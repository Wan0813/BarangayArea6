import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import Loading from '../components/Loading';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { complaints } from '../api/endpoints';
import { resolveFileUrl } from '../api/client';
import usePagedList from '../hooks/usePagedList';
import useStaffList from '../hooks/useStaffList';
import {
  COMPLAINT_STATUSES,
  errorMessage,
  formatDate,
  formatDateTime,
  humanize,
  truncate,
} from '../utils/format';

const INITIAL_FILTERS = { status: '', type: '' };

export default function Complaints() {
  const { isAdmin, isHeadAdmin, isResident } = useAuth();
  const toast = useToast();
  const { staff } = useStaffList();

  const list = usePagedList(complaints.list, { initialFilters: INITIAL_FILTERS });

  const [types, setTypes] = useState([]);
  const [detail, setDetail] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  const [statusTarget, setStatusTarget] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'Pending', response: '', assignedOfficerId: '' });
  const [statusBusy, setStatusBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    complaints
      .types()
      .then((data) => setTypes(Array.isArray(data) ? data : []))
      .catch(() => setTypes([]));
  }, []);

  const loadComments = useCallback(async (complaintId) => {
    setCommentsLoading(true);
    try {
      const data = await complaints.comments(complaintId);
      setComments(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setComments([]);
      toast.error(errorMessage(err));
    } finally {
      setCommentsLoading(false);
    }
  }, [toast]);

  function openDetail(row) {
    setDetail(row);
    setCommentText('');
    loadComments(row.id);
  }

  function closeDetail() {
    setDetail(null);
    setComments([]);
    setCommentText('');
  }

  function openStatusModal(row) {
    setStatusTarget(row);
    setStatusForm({
      status: row.status || 'Pending',
      response: row.response || '',
      assignedOfficerId: row.assignedOfficerId ? String(row.assignedOfficerId) : '',
    });
  }

  async function submitStatus(event) {
    event.preventDefault();
    if (!statusTarget) return;
    setStatusBusy(true);
    try {
      await complaints.setStatus(statusTarget.id, {
        status: statusForm.status,
        response: statusForm.response,
        assignedOfficerId: statusForm.assignedOfficerId ? Number(statusForm.assignedOfficerId) : null,
      });
      toast.success(`Complaint #${statusTarget.id} updated.`);
      setStatusTarget(null);
      list.reload();
      if (detail && detail.id === statusTarget.id) closeDetail();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setStatusBusy(false);
    }
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!detail || !commentText.trim()) return;
    setCommentBusy(true);
    try {
      await complaints.addComment(detail.id, { message: commentText.trim() });
      setCommentText('');
      toast.success('Comment added.');
      loadComments(detail.id);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCommentBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await complaints.remove(deleteTarget.id);
      toast.success(`Complaint #${deleteTarget.id} deleted.`);
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
      header: 'Reporter',
      render: (row) => (
        <span className="cell-stack">
          <strong>{row.reporterUsername || '—'}</strong>
          <small>{row.reporterFullName || ''}</small>
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => (
        <span className="cell-stack">
          <strong>{truncate(row.subject, 60)}</strong>
          <small>{truncate(row.description, 70)}</small>
        </span>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => row.type || '—' },
    { key: 'location', header: 'Location', render: (row) => <span className="cell-truncate">{row.location || '—'}</span> },
    { key: 'createdAt', header: 'Filed', render: (row) => formatDate(row.createdAt) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'commentCount',
      header: 'Comments',
      render: (row) => <span className="badge">{row.commentCount ?? row.comments?.length ?? 0}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => openDetail(row)}>
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
        title={isResident ? 'My Complaints' : 'Complaints'}
        subtitle={
          isResident
            ? 'Read-only view of the complaints you filed. You can still reply to the discussion thread.'
            : 'Search, track and respond to filed complaints.'
        }
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
        placeholder="Search by username, subject or location…"
        loading={list.loading}
      >
        <label className="filter">
          <span>Status</span>
          <select value={list.filters.status} onChange={(event) => list.setFilter('status', event.target.value)}>
            <option value="">All statuses</option>
            {COMPLAINT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="filter">
          <span>Type</span>
          <select value={list.filters.type} onChange={(event) => list.setFilter('type', event.target.value)}>
            <option value="">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
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
        emptyTitle="No complaints found"
        emptyMessage="No complaints match the current search or filters."
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

      {/* ------------------------- complaint detail ------------------------ */}
      <Modal open={Boolean(detail)} title={detail ? `Complaint #${detail.id}` : ''} onClose={closeDetail} size="lg">
        {detail ? (
          <>
            <dl className="detail-list">
              <dt>Subject</dt>
              <dd>{detail.subject}</dd>
              <dt>Type</dt>
              <dd>{detail.type || '—'}</dd>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={detail.status} />
              </dd>
              <dt>Location</dt>
              <dd>{detail.location || '—'}</dd>
              <dt>Reporter</dt>
              <dd>
                {detail.reporterUsername || '—'}
                {detail.reporterFullName ? ` (${detail.reporterFullName})` : ''}
              </dd>
              <dt>Contact</dt>
              <dd>{detail.reporterContact || '—'}</dd>
              <dt>Filed</dt>
              <dd>{formatDateTime(detail.createdAt)}</dd>
              <dt>Assigned officer</dt>
              <dd>{detail.assignedOfficerName || 'Unassigned'}</dd>
              <dt>Description</dt>
              <dd className="comment-body">{detail.description || '—'}</dd>
              <dt>Official response</dt>
              <dd className="comment-body">{detail.response || 'No response recorded yet.'}</dd>
            </dl>

            {detail.imageUrl ? (
              <FormField label="Attached photo">
                <button type="button" className="thumb-btn" onClick={() => setImagePreview(resolveFileUrl(detail.imageUrl))}>
                  <img src={resolveFileUrl(detail.imageUrl)} alt="Complaint attachment" />
                </button>
              </FormField>
            ) : null}

            <h3>Discussion thread</h3>
            {commentsLoading ? (
              <Loading label="Loading comments…" />
            ) : comments.length === 0 ? (
              <p className="muted">No comments yet.</p>
            ) : (
              <div className="comment-list">
                {comments.map((comment) => (
                  <div className="comment" key={comment.id}>
                    <div className="comment-head">
                      <span>
                        <strong>{comment.authorName || 'User'}</strong>
                        {comment.isStaffReply ? ' · staff' : ''}
                        {comment.statusAtPost ? ` · status: ${humanize(comment.statusAtPost)}` : ''}
                      </span>
                      <span>{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <p className="comment-body">{comment.message}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={submitComment}>
              <FormField label="Add a comment" htmlFor="complaint-comment">
                <textarea
                  id="complaint-comment"
                  rows={3}
                  value={commentText}
                  placeholder="Write your reply or update…"
                  onChange={(event) => setCommentText(event.target.value)}
                />
              </FormField>
              <div className="actions-row">
                <button type="submit" className="btn btn-primary" disabled={commentBusy || !commentText.trim()}>
                  {commentBusy ? 'Posting…' : 'Post comment'}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </Modal>

      {/* -------------------------- status update ------------------------- */}
      <Modal
        open={Boolean(statusTarget)}
        title={statusTarget ? `Update complaint #${statusTarget.id}` : ''}
        onClose={() => setStatusTarget(null)}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setStatusTarget(null)} disabled={statusBusy}>
              Cancel
            </button>
            <button type="submit" form="complaint-status-form" className="btn btn-primary" disabled={statusBusy}>
              {statusBusy ? 'Saving…' : 'Save update'}
            </button>
          </>
        }
      >
        <form id="complaint-status-form" onSubmit={submitStatus}>
          <FormField label="Status" htmlFor="cs-status" required>
            <select
              id="cs-status"
              value={statusForm.status}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              {COMPLAINT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Response / detailed reply"
            htmlFor="cs-response"
            hint="Shown to the complainant and stored with the record."
          >
            <textarea
              id="cs-response"
              rows={5}
              value={statusForm.response}
              onChange={(event) => setStatusForm((prev) => ({ ...prev, response: event.target.value }))}
            />
          </FormField>

          <FormField label="Assigned officer" htmlFor="cs-officer" hint="Barangay staff handling this complaint.">
            <select
              id="cs-officer"
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
        title="Delete complaint"
        message={
          deleteTarget
            ? `Delete complaint #${deleteTarget.id} ("${deleteTarget.subject}")? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Modal open={Boolean(imagePreview)} title="Attachment" onClose={() => setImagePreview(null)} size="lg">
        {imagePreview ? <img className="lightbox-image" src={imagePreview} alt="Attachment" /> : null}
      </Modal>
    </>
  );
}
