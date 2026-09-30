import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import ImageUpload from '../components/ImageUpload';
import Loading from '../components/Loading';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { about as aboutApi } from '../api/endpoints';
import { resolveFileUrl } from '../api/client';
import { errorMessage } from '../utils/format';

const ABOUT_FIELDS = [
  { key: 'mission', label: 'Mission', type: 'textarea' },
  { key: 'vision', label: 'Vision', type: 'textarea' },
  { key: 'history', label: 'History', type: 'textarea' },
  { key: 'contactEmail', label: 'Contact email', type: 'email' },
  { key: 'contactNumber', label: 'Contact number', type: 'tel' },
  { key: 'officeHours', label: 'Office hours', type: 'text' },
];

const EMPTY_HOTLINE = { name: '', number: '', description: '', sortOrder: 0, isEmergency: true };
const EMPTY_ORG = { name: '', position: '', parentId: '', sortOrder: 0, userId: '' };

function buildTree(list) {
  const nodes = (list || []).map((item) => ({
    ...item,
    children: Array.isArray(item.children) ? item.children : [],
  }));
  if (nodes.some((node) => node.children.length > 0)) {
    return nodes.filter((node) => node.parentId === null || node.parentId === undefined);
  }
  const byParent = new Map();
  nodes.forEach((node) => {
    const key = node.parentId ?? 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(node);
  });
  const attach = (parentId) =>
    (byParent.get(parentId ?? 'root') || [])
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((node) => ({ ...node, children: attach(node.id) }));
  return attach(null);
}

function OrgNode({ node, canEdit, onEdit, onAddChild, onDelete }) {
  return (
    <li>
      <div className="org-node">
        {node.photoUrl ? <img src={resolveFileUrl(node.photoUrl)} alt={node.name} /> : null}
        <span className="org-node-text">
          <strong>{node.name}</strong>
          <small>
            {node.position || '—'}
            {node.sortOrder ? ` · order ${node.sortOrder}` : ''}
          </small>
        </span>
        {canEdit ? (
          <span className="row-actions">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onEdit(node)}>
              Edit
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onAddChild(node)}>
              + Sub
            </button>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => onDelete(node)}>
              Remove
            </button>
          </span>
        ) : null}
      </div>
      {node.children && node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <OrgNode
              key={child.id}
              node={child}
              canEdit={canEdit}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function About() {
  const { isHeadAdmin } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [info, setInfo] = useState({
    barangayName: '',
    municipality: '',
    mission: '',
    vision: '',
    history: '',
    contactEmail: '',
    contactNumber: '',
    officeHours: '',
  });
  const [infoBusy, setInfoBusy] = useState(false);

  const [hotlines, setHotlines] = useState([]);
  const [hotlineForm, setHotlineForm] = useState(EMPTY_HOTLINE);
  const [hotlineOpen, setHotlineOpen] = useState(false);
  const [hotlineEditing, setHotlineEditing] = useState(null);
  const [hotlineBusy, setHotlineBusy] = useState(false);
  const [hotlineDelete, setHotlineDelete] = useState(null);

  const [organization, setOrganization] = useState([]);
  const [orgForm, setOrgForm] = useState(EMPTY_ORG);
  const [orgOpen, setOrgOpen] = useState(false);
  const [orgEditing, setOrgEditing] = useState(null);
  const [orgPhoto, setOrgPhoto] = useState(null);
  const [orgBusy, setOrgBusy] = useState(false);
  const [orgDelete, setOrgDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await aboutApi.get();
      const bundle = data || {};
      setInfo({
        barangayName: bundle.about?.barangayName || '',
        municipality: bundle.about?.municipality || '',
        mission: bundle.about?.mission || '',
        vision: bundle.about?.vision || '',
        history: bundle.about?.history || '',
        contactEmail: bundle.about?.contactEmail || '',
        contactNumber: bundle.about?.contactNumber || '',
        officeHours: bundle.about?.officeHours || '',
      });
      setHotlines(Array.isArray(bundle.hotlines) ? bundle.hotlines : []);
      setOrganization(Array.isArray(bundle.organization) ? bundle.organization : []);
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveInfo(event) {
    event.preventDefault();
    setInfoBusy(true);
    try {
      await aboutApi.update(info);
      toast.success('About page saved.');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setInfoBusy(false);
    }
  }

  function openHotlineCreate() {
    setHotlineEditing(null);
    setHotlineForm({ ...EMPTY_HOTLINE, sortOrder: hotlines.length + 1 });
    setHotlineOpen(true);
  }

  function openHotlineEdit(row) {
    setHotlineEditing(row);
    setHotlineForm({
      name: row.name || '',
      number: row.number || '',
      description: row.description || '',
      sortOrder: row.sortOrder ?? 0,
      isEmergency: row.isEmergency !== false,
    });
    setHotlineOpen(true);
  }

  async function saveHotline(event) {
    event.preventDefault();
    if (!hotlineForm.name.trim() || !hotlineForm.number.trim()) {
      toast.error('Hotline name and number are required.');
      return;
    }
    setHotlineBusy(true);
    try {
      const payload = { ...hotlineForm, sortOrder: Number(hotlineForm.sortOrder) || 0 };
      if (hotlineEditing) {
        await aboutApi.updateHotline(hotlineEditing.id, payload);
        toast.success('Hotline updated.');
      } else {
        await aboutApi.createHotline(payload);
        toast.success('Hotline added.');
      }
      setHotlineOpen(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setHotlineBusy(false);
    }
  }

  async function removeHotline() {
    if (!hotlineDelete) return;
    setHotlineBusy(true);
    try {
      await aboutApi.removeHotline(hotlineDelete.id);
      toast.success('Hotline deleted.');
      setHotlineDelete(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setHotlineBusy(false);
    }
  }

  function openOrgCreate(parent) {
    setOrgEditing(null);
    setOrgPhoto(null);
    setOrgForm({ ...EMPTY_ORG, parentId: parent ? String(parent.id) : '', sortOrder: organization.length + 1 });
    setOrgOpen(true);
  }

  function openOrgEdit(node) {
    setOrgEditing(node);
    setOrgPhoto(null);
    setOrgForm({
      name: node.name || '',
      position: node.position || '',
      parentId: node.parentId ? String(node.parentId) : '',
      sortOrder: node.sortOrder ?? 0,
      userId: node.userId ? String(node.userId) : '',
    });
    setOrgOpen(true);
  }

  async function saveOrg(event) {
    event.preventDefault();
    if (!orgForm.name.trim()) {
      toast.error('A name is required.');
      return;
    }
    setOrgBusy(true);
    try {
      const values = {
        name: orgForm.name.trim(),
        position: orgForm.position,
        parentId: orgForm.parentId || '',
        sortOrder: Number(orgForm.sortOrder) || 0,
        userId: orgForm.userId || '',
      };
      if (orgEditing) {
        await aboutApi.updateOrg(orgEditing.id, values, orgPhoto);
        toast.success('Organization member updated.');
      } else {
        await aboutApi.createOrg(values, orgPhoto);
        toast.success('Organization member added.');
      }
      setOrgOpen(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setOrgBusy(false);
    }
  }

  async function removeOrg() {
    if (!orgDelete) return;
    setOrgBusy(true);
    try {
      await aboutApi.removeOrg(orgDelete.id);
      toast.success('Organization member removed.');
      setOrgDelete(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setOrgBusy(false);
    }
  }

  const tree = buildTree(organization);
  const parentOptions = organization.filter((member) => !orgEditing || member.id !== orgEditing.id);

  if (loading) return <Loading label="Loading About page…" full />;

  return (
    <>
      <PageHeader
        title="About"
        subtitle="Public information shown on the website and mobile app."
        actions={
          <button type="button" className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        }
      />

      {error ? <div className="error-banner">{error}</div> : null}

      {!isHeadAdmin ? (
        <div className="note">Only Head Admin accounts can change the About page content.</div>
      ) : null}

      <div className="tabs">
        <button type="button" className={`tab${tab === 'info' ? ' is-active' : ''}`} onClick={() => setTab('info')}>
          Barangay info
        </button>
        <button type="button" className={`tab${tab === 'hotlines' ? ' is-active' : ''}`} onClick={() => setTab('hotlines')}>
          Emergency hotlines
        </button>
        <button
          type="button"
          className={`tab${tab === 'organization' ? ' is-active' : ''}`}
          onClick={() => setTab('organization')}
        >
          Organization chart
        </button>
      </div>

      {tab === 'info' ? (
        <section className="panel">
          <form onSubmit={saveInfo}>
            <div className="form-grid">
              <FormField label="Barangay name" htmlFor="ab-name" required>
                <input
                  id="ab-name"
                  type="text"
                  disabled={!isHeadAdmin}
                  value={info.barangayName}
                  onChange={(event) => setInfo((prev) => ({ ...prev, barangayName: event.target.value }))}
                />
              </FormField>

              <FormField label="Municipality" htmlFor="ab-muni" required>
                <input
                  id="ab-muni"
                  type="text"
                  disabled={!isHeadAdmin}
                  value={info.municipality}
                  onChange={(event) => setInfo((prev) => ({ ...prev, municipality: event.target.value }))}
                />
              </FormField>

              {ABOUT_FIELDS.map((field) => (
                <FormField
                  key={field.key}
                  label={field.label}
                  htmlFor={`ab-${field.key}`}
                  className={field.type === 'textarea' ? 'span-2' : undefined}
                >
                  {field.type === 'textarea' ? (
                    <textarea
                      id={`ab-${field.key}`}
                      rows={4}
                      disabled={!isHeadAdmin}
                      value={info[field.key]}
                      onChange={(event) => setInfo((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    />
                  ) : (
                    <input
                      id={`ab-${field.key}`}
                      type={field.type}
                      disabled={!isHeadAdmin}
                      value={info[field.key]}
                      onChange={(event) => setInfo((prev) => ({ ...prev, [field.key]: event.target.value }))}
                    />
                  )}
                </FormField>
              ))}
            </div>

            {isHeadAdmin ? (
              <div className="actions-row">
                <button type="submit" className="btn btn-primary" disabled={infoBusy}>
                  {infoBusy ? 'Saving…' : 'Save About page'}
                </button>
              </div>
            ) : null}
          </form>
        </section>
      ) : null}

      {tab === 'hotlines' ? (
        <section className="panel">
          <header className="panel-head">
            <h2>Emergency hotlines</h2>
            {isHeadAdmin ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={openHotlineCreate}>
                + Add hotline
              </button>
            ) : null}
          </header>

          {hotlines.length === 0 ? (
            <p className="muted">No hotlines recorded yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Number</th>
                    <th>Description</th>
                    <th>Order</th>
                    <th>Emergency</th>
                    {isHeadAdmin ? <th>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {hotlines.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.number}</td>
                      <td>{row.description || '—'}</td>
                      <td>{row.sortOrder ?? 0}</td>
                      <td>{row.isEmergency ? 'Yes' : 'No'}</td>
                      {isHeadAdmin ? (
                        <td>
                          <div className="row-actions">
                            <button type="button" className="btn btn-sm btn-ghost" onClick={() => openHotlineEdit(row)}>
                              Edit
                            </button>
                            <button type="button" className="btn btn-sm btn-danger" onClick={() => setHotlineDelete(row)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === 'organization' ? (
        <section className="panel">
          <header className="panel-head">
            <h2>Organization chart</h2>
            {isHeadAdmin ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => openOrgCreate(null)}>
                + Add top-level member
              </button>
            ) : null}
          </header>

          {tree.length === 0 ? (
            <p className="muted">No organization members yet.</p>
          ) : (
            <div className="org-tree">
              <ul>
                {tree.map((node) => (
                  <OrgNode
                    key={node.id}
                    node={node}
                    canEdit={isHeadAdmin}
                    onEdit={openOrgEdit}
                    onAddChild={openOrgCreate}
                    onDelete={setOrgDelete}
                  />
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : null}

      {/* ----------------------------- hotline form ------------------------ */}
      <Modal
        open={hotlineOpen}
        title={hotlineEditing ? `Edit hotline #${hotlineEditing.id}` : 'Add hotline'}
        onClose={() => setHotlineOpen(false)}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setHotlineOpen(false)} disabled={hotlineBusy}>
              Cancel
            </button>
            <button type="submit" form="hotline-form" className="btn btn-primary" disabled={hotlineBusy}>
              {hotlineBusy ? 'Saving…' : 'Save hotline'}
            </button>
          </>
        }
      >
        <form id="hotline-form" onSubmit={saveHotline}>
          <FormField label="Name" htmlFor="hl-name" required>
            <input
              id="hl-name"
              type="text"
              value={hotlineForm.name}
              onChange={(event) => setHotlineForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </FormField>
          <FormField label="Number" htmlFor="hl-number" required>
            <input
              id="hl-number"
              type="text"
              value={hotlineForm.number}
              onChange={(event) => setHotlineForm((prev) => ({ ...prev, number: event.target.value }))}
            />
          </FormField>
          <FormField label="Description" htmlFor="hl-desc">
            <input
              id="hl-desc"
              type="text"
              value={hotlineForm.description}
              onChange={(event) => setHotlineForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </FormField>
          <FormField label="Sort order" htmlFor="hl-sort">
            <input
              id="hl-sort"
              type="number"
              value={hotlineForm.sortOrder}
              onChange={(event) => setHotlineForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
            />
          </FormField>
          <FormField label="" className="checkbox-field">
            <label htmlFor="hl-emergency">
              <input
                id="hl-emergency"
                type="checkbox"
                checked={hotlineForm.isEmergency}
                onChange={(event) => setHotlineForm((prev) => ({ ...prev, isEmergency: event.target.checked }))}
              />
              Show under emergency hotlines
            </label>
          </FormField>
        </form>
      </Modal>

      {/* ---------------------------- organization form --------------------- */}
      <Modal
        open={orgOpen}
        title={orgEditing ? `Edit member #${orgEditing.id}` : 'Add organization member'}
        onClose={() => setOrgOpen(false)}
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setOrgOpen(false)} disabled={orgBusy}>
              Cancel
            </button>
            <button type="submit" form="org-form" className="btn btn-primary" disabled={orgBusy}>
              {orgBusy ? 'Saving…' : 'Save member'}
            </button>
          </>
        }
      >
        <form id="org-form" onSubmit={saveOrg}>
          <FormField label="Name" htmlFor="og-name" required>
            <input
              id="og-name"
              type="text"
              value={orgForm.name}
              onChange={(event) => setOrgForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </FormField>
          <FormField label="Position" htmlFor="og-position">
            <input
              id="og-position"
              type="text"
              value={orgForm.position}
              onChange={(event) => setOrgForm((prev) => ({ ...prev, position: event.target.value }))}
            />
          </FormField>
          <FormField label="Reports to (parent)" htmlFor="og-parent" hint="Leave empty for a top-level position.">
            <select
              id="og-parent"
              value={orgForm.parentId}
              onChange={(event) => setOrgForm((prev) => ({ ...prev, parentId: event.target.value }))}
            >
              <option value="">— Top level —</option>
              {parentOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                  {member.position ? ` — ${member.position}` : ''}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Sort order" htmlFor="og-sort">
            <input
              id="og-sort"
              type="number"
              value={orgForm.sortOrder}
              onChange={(event) => setOrgForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
            />
          </FormField>
          <FormField label="Linked user account ID (optional)" htmlFor="og-user">
            <input
              id="og-user"
              type="number"
              value={orgForm.userId}
              onChange={(event) => setOrgForm((prev) => ({ ...prev, userId: event.target.value }))}
            />
          </FormField>
          <ImageUpload label="Photo (optional)" value={orgPhoto} existingUrl={orgEditing?.photoUrl} onChange={setOrgPhoto} />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(hotlineDelete)}
        title="Delete hotline"
        message={hotlineDelete ? `Delete "${hotlineDelete.name}"?` : ''}
        confirmLabel="Delete"
        danger
        busy={hotlineBusy}
        onConfirm={removeHotline}
        onCancel={() => setHotlineDelete(null)}
      />

      <ConfirmDialog
        open={Boolean(orgDelete)}
        title="Remove organization member"
        message={orgDelete ? `Remove "${orgDelete.name}" from the organization chart?` : ''}
        confirmLabel="Remove"
        danger
        busy={orgBusy}
        onConfirm={removeOrg}
        onCancel={() => setOrgDelete(null)}
      />
    </>
  );
}
