import { useCallback, useState } from 'react';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import Loading from '../components/Loading';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { households } from '../api/endpoints';
import usePagedList from '../hooks/usePagedList';
import { errorMessage } from '../utils/format';

const INITIAL_FILTERS = {};

const EMPTY_HOUSEHOLD = {
  householdNumber: '',
  address: '',
  purok: '',
  headOfFamily: '',
  contactNumber: '',
  isActive: true,
};

const EMPTY_MEMBER = {
  fullName: '',
  age: '',
  gender: '',
  relationToHead: '',
  civilStatus: '',
  occupation: '',
};

export default function Households() {
  const { isHeadAdmin } = useAuth();
  const toast = useToast();
  const list = usePagedList(households.list, { initialFilters: INITIAL_FILTERS });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_HOUSEHOLD);
  const [busy, setBusy] = useState(false);

  const [memberTarget, setMemberTarget] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [newMember, setNewMember] = useState(EMPTY_MEMBER);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [memberEdit, setMemberEdit] = useState(EMPTY_MEMBER);
  const [memberBusy, setMemberBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadMembers = useCallback(
    async (household) => {
      setMembersLoading(true);
      try {
        const data = await households.get(household.id);
        setMembers(Array.isArray(data?.members) ? data.members : []);
      } catch (err) {
        setMembers([]);
        toast.error(errorMessage(err));
      } finally {
        setMembersLoading(false);
      }
    },
    [toast],
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_HOUSEHOLD);
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      householdNumber: row.householdNumber || '',
      address: row.address || '',
      purok: row.purok || '',
      headOfFamily: row.headOfFamily || '',
      contactNumber: row.contactNumber || '',
      isActive: row.isActive !== false,
    });
    setFormOpen(true);
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!form.headOfFamily.trim()) {
      toast.error('Head of family is required.');
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await households.update(editing.id, form);
        toast.success('Household updated.');
      } else {
        await households.create(form);
        toast.success('Household created.');
      }
      setFormOpen(false);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function openMembers(row) {
    setMemberTarget(row);
    setMembers([]);
    setNewMember(EMPTY_MEMBER);
    setEditingMemberId(null);
    loadMembers(row);
  }

  async function addMember(event) {
    event.preventDefault();
    if (!memberTarget) return;
    if (!newMember.fullName.trim()) {
      toast.error('The member needs a full name.');
      return;
    }
    setMemberBusy(true);
    try {
      await households.addMember(memberTarget.id, {
        ...newMember,
        age: newMember.age === '' ? null : Number(newMember.age),
      });
      toast.success('Member added.');
      setNewMember(EMPTY_MEMBER);
      loadMembers(memberTarget);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setMemberBusy(false);
    }
  }

  async function saveMember(memberId) {
    setMemberBusy(true);
    try {
      await households.updateMember(memberId, {
        ...memberEdit,
        age: memberEdit.age === '' ? null : Number(memberEdit.age),
      });
      toast.success('Member updated.');
      setEditingMemberId(null);
      loadMembers(memberTarget);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setMemberBusy(false);
    }
  }

  async function removeMember(memberId) {
    setMemberBusy(true);
    try {
      await households.removeMember(memberId);
      toast.success('Member removed.');
      loadMembers(memberTarget);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setMemberBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await households.remove(deleteTarget.id);
      toast.success('Household deleted.');
      setDeleteTarget(null);
      list.reloadAfterDelete();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  }

  const columns = [
    { key: 'householdNumber', header: 'Household no.', render: (row) => row.householdNumber || `#${row.id}` },
    { key: 'address', header: 'Address', render: (row) => <span className="cell-truncate">{row.address || '—'}</span> },
    { key: 'purok', header: 'Purok', render: (row) => row.purok || '—' },
    {
      key: 'headOfFamily',
      header: 'Head of family',
      render: (row) => (
        <span className="cell-stack">
          <strong>{row.headOfFamily || '—'}</strong>
          <small>{row.contactNumber || ''}</small>
        </span>
      ),
    },
    { key: 'residentCount', header: 'Residents', render: (row) => <span className="badge">{row.residentCount ?? 0}</span> },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <span className={`badge ${row.isActive === false ? 'badge-muted' : 'badge-active'}`}>
          {row.isActive === false ? 'Inactive' : 'Active'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <button type="button" className="btn btn-sm btn-primary" onClick={() => openMembers(row)}>
            Members
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => openEdit(row)}>
            Edit
          </button>
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
        title="Households"
        subtitle="Household records and their members. Total residents come from these rows."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={list.reload} disabled={list.loading}>
              {list.loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              + New household
            </button>
          </>
        }
      />

      {!isHeadAdmin ? (
        <div className="note">Deleting a household is limited to Head Admin accounts.</div>
      ) : null}

      <SearchBar
        search={list.search}
        onSearchChange={list.setSearch}
        onSubmit={list.submitSearch}
        onReset={list.reset}
        initialFilters={INITIAL_FILTERS}
        placeholder="Search by household number, address, purok or head of family…"
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
        emptyTitle="No households"
        emptyMessage="No household records match the current search."
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

      {/* --------------------------- household form ------------------------ */}
      <Modal
        open={formOpen}
        title={editing ? `Edit household #${editing.id}` : 'New household'}
        onClose={() => setFormOpen(false)}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="household-form" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create household'}
            </button>
          </>
        }
      >
        <form id="household-form" onSubmit={submitForm}>
          <div className="form-grid">
            <FormField label="Household number" htmlFor="hh-number" hint="Leave blank to let the server assign one.">
              <input
                id="hh-number"
                type="text"
                value={form.householdNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, householdNumber: event.target.value }))}
              />
            </FormField>

            <FormField label="Purok / Sitio" htmlFor="hh-purok">
              <input
                id="hh-purok"
                type="text"
                value={form.purok}
                onChange={(event) => setForm((prev) => ({ ...prev, purok: event.target.value }))}
              />
            </FormField>

            <FormField label="Head of family" htmlFor="hh-head" required>
              <input
                id="hh-head"
                type="text"
                value={form.headOfFamily}
                onChange={(event) => setForm((prev) => ({ ...prev, headOfFamily: event.target.value }))}
              />
            </FormField>

            <FormField label="Contact number" htmlFor="hh-contact">
              <input
                id="hh-contact"
                type="tel"
                value={form.contactNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, contactNumber: event.target.value }))}
              />
            </FormField>

            <FormField label="Address" htmlFor="hh-address" className="span-2">
              <textarea
                id="hh-address"
                rows={2}
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </FormField>

            <FormField label="" className="checkbox-field">
              <label htmlFor="hh-active">
                <input
                  id="hh-active"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                Active household
              </label>
            </FormField>
          </div>
        </form>
      </Modal>

      {/* ----------------------------- members ----------------------------- */}
      <Modal
        open={Boolean(memberTarget)}
        title={memberTarget ? `Members — ${memberTarget.householdNumber || `#${memberTarget.id}`}` : ''}
        onClose={() => setMemberTarget(null)}
        size="lg"
      >
        {membersLoading ? (
          <Loading label="Loading members…" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="member-table">
                <thead>
                  <tr>
                    <th>Full name</th>
                    <th style={{ width: '70px' }}>Age</th>
                    <th style={{ width: '100px' }}>Gender</th>
                    <th>Relation to head</th>
                    <th>Civil status</th>
                    <th>Occupation</th>
                    <th style={{ width: '130px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="muted">
                        No members recorded yet.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) =>
                      editingMemberId === member.id ? (
                        <tr key={member.id}>
                          <td>
                            <input
                              value={memberEdit.fullName}
                              onChange={(event) => setMemberEdit((prev) => ({ ...prev, fullName: event.target.value }))}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={memberEdit.age}
                              onChange={(event) => setMemberEdit((prev) => ({ ...prev, age: event.target.value }))}
                            />
                          </td>
                          <td>
                            <input
                              value={memberEdit.gender}
                              onChange={(event) => setMemberEdit((prev) => ({ ...prev, gender: event.target.value }))}
                            />
                          </td>
                          <td>
                            <input
                              value={memberEdit.relationToHead}
                              onChange={(event) =>
                                setMemberEdit((prev) => ({ ...prev, relationToHead: event.target.value }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={memberEdit.civilStatus}
                              onChange={(event) => setMemberEdit((prev) => ({ ...prev, civilStatus: event.target.value }))}
                            />
                          </td>
                          <td>
                            <input
                              value={memberEdit.occupation}
                              onChange={(event) => setMemberEdit((prev) => ({ ...prev, occupation: event.target.value }))}
                            />
                          </td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => saveMember(member.id)}
                                disabled={memberBusy}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                onClick={() => setEditingMemberId(null)}
                                disabled={memberBusy}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={member.id}>
                          <td>
                            <strong>{member.fullName}</strong>
                            {member.isAppUser ? <span className="badge badge-admin" style={{ marginLeft: 6 }}>app user</span> : null}
                          </td>
                          <td>{member.age ?? '—'}</td>
                          <td>{member.gender || '—'}</td>
                          <td>{member.relationToHead || '—'}</td>
                          <td>{member.civilStatus || '—'}</td>
                          <td>{member.occupation || '—'}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="btn btn-sm btn-ghost"
                                onClick={() => {
                                  setEditingMemberId(member.id);
                                  setMemberEdit({
                                    fullName: member.fullName || '',
                                    age: member.age ?? '',
                                    gender: member.gender || '',
                                    relationToHead: member.relationToHead || '',
                                    civilStatus: member.civilStatus || '',
                                    occupation: member.occupation || '',
                                  });
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => removeMember(member.id)}
                                disabled={memberBusy}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
            </div>

            <h3 style={{ marginTop: '1rem' }}>Add a member</h3>
            <form onSubmit={addMember}>
              <div className="form-grid">
                <FormField label="Full name" htmlFor="m-name" required>
                  <input
                    id="m-name"
                    type="text"
                    value={newMember.fullName}
                    onChange={(event) => setNewMember((prev) => ({ ...prev, fullName: event.target.value }))}
                  />
                </FormField>
                <FormField label="Age" htmlFor="m-age">
                  <input
                    id="m-age"
                    type="number"
                    min="0"
                    value={newMember.age}
                    onChange={(event) => setNewMember((prev) => ({ ...prev, age: event.target.value }))}
                  />
                </FormField>
                <FormField label="Gender" htmlFor="m-gender">
                  <input
                    id="m-gender"
                    type="text"
                    value={newMember.gender}
                    onChange={(event) => setNewMember((prev) => ({ ...prev, gender: event.target.value }))}
                  />
                </FormField>
                <FormField label="Relation to head" htmlFor="m-relation">
                  <input
                    id="m-relation"
                    type="text"
                    value={newMember.relationToHead}
                    onChange={(event) => setNewMember((prev) => ({ ...prev, relationToHead: event.target.value }))}
                  />
                </FormField>
                <FormField label="Civil status" htmlFor="m-civil">
                  <input
                    id="m-civil"
                    type="text"
                    value={newMember.civilStatus}
                    onChange={(event) => setNewMember((prev) => ({ ...prev, civilStatus: event.target.value }))}
                  />
                </FormField>
                <FormField label="Occupation" htmlFor="m-occupation">
                  <input
                    id="m-occupation"
                    type="text"
                    value={newMember.occupation}
                    onChange={(event) => setNewMember((prev) => ({ ...prev, occupation: event.target.value }))}
                  />
                </FormField>
              </div>
              <div className="actions-row">
                <button type="submit" className="btn btn-primary" disabled={memberBusy}>
                  {memberBusy ? 'Saving…' : 'Add member'}
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete household"
        message={
          deleteTarget
            ? `Delete household ${deleteTarget.householdNumber || `#${deleteTarget.id}`} and its member rows?`
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
