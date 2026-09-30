import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import BarChart from '../components/BarChart';
import DataTable from '../components/DataTable';
import Loading from '../components/Loading';
import { useToast } from '../components/Toast';
import { dashboard } from '../api/endpoints';
import { config } from '../config';
import { errorMessage, humanize, todayInputValue } from '../utils/format';

export default function Dashboard() {
  const toast = useToast();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rosterDate, setRosterDate] = useState(todayInputValue());
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dashboard.overview();
      setOverview(data || {});
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadRoster = useCallback(async () => {
    setRosterLoading(true);
    setRosterError('');
    try {
      const data = await dashboard.dutyRoster(rosterDate || undefined);
      setRoster(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      const message = errorMessage(err);
      setRosterError(message);
      setRoster([]);
    } finally {
      setRosterLoading(false);
    }
  }, [rosterDate]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const complaintStats = overview?.complaintStats || {};
  const emergencyStats = overview?.emergencyStats || {};

  const complaintBars = [
    { label: 'Pending', value: complaintStats.pending ?? overview?.pendingComplaints ?? 0 },
    { label: 'Ongoing', value: complaintStats.ongoing ?? 0 },
    { label: 'Resolved', value: complaintStats.resolved ?? 0 },
    { label: 'Rejected', value: complaintStats.rejected ?? 0 },
  ];

  const emergencyBars = [
    { label: 'Pending', value: emergencyStats.pending ?? overview?.pendingEmergencies ?? 0 },
    { label: 'Approved', value: emergencyStats.approved ?? 0 },
    { label: 'Processing', value: emergencyStats.processing ?? 0 },
    { label: 'Declined', value: emergencyStats.declined ?? 0 },
  ];

  const rosterColumns = [
    { key: 'personnelName', header: 'Personnel', render: (row) => row.personnelName || '—' },
    { key: 'assignedDuty', header: 'Assigned duty', render: (row) => row.assignedDuty || '—' },
    { key: 'area', header: 'Area', render: (row) => row.area || '—' },
    { key: 'position', header: 'Position', render: (row) => row.position || '—' },
    { key: 'shift', header: 'Shift', render: (row) => humanize(row.shift) },
    { key: 'timeRange', header: 'Time', render: (row) => row.timeRange || '—' },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${config.barangayName} · ${config.municipality}`}
        actions={
          <button type="button" className="btn btn-ghost" onClick={loadOverview} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      {error ? (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={loadOverview}>
            Try again
          </button>
        </div>
      ) : null}

      {loading && !overview ? (
        <Loading label="Loading dashboard…" full />
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Pending sign-ups" value={overview?.pendingSignups} accent="warning" hint="Accounts awaiting approval" />
            <StatCard label="Pending complaints" value={overview?.pendingComplaints} accent="warning" />
            <StatCard label="Pending emergencies" value={overview?.pendingEmergencies} accent="danger" />
            <StatCard label="Total residents" value={overview?.totalResidents} accent="info" hint="Household members" />
            <StatCard label="Total households" value={overview?.totalHouseholds} accent="info" />
            <StatCard label="Total staff" value={overview?.totalStaff} />
            <StatCard label="Published daily logs" value={overview?.publishedOperations} accent="success" />
            <StatCard label="Total complaints" value={overview?.totalComplaints} />
            <StatCard label="Total emergencies" value={overview?.totalEmergencies} />
          </div>

          <div className="grid-2">
            <BarChart title="Complaints" items={complaintBars} />
            <BarChart title="Emergencies" items={emergencyBars} />
          </div>

          <section className="panel">
            <header className="panel-head">
              <h2>Personnel on duty</h2>
              <div className="toolbar-row" style={{ margin: 0 }}>
                <label className="filter">
                  <span className="small muted">Duty date</span>
                  <input
                    type="date"
                    value={rosterDate}
                    onChange={(event) => setRosterDate(event.target.value)}
                  />
                </label>
              </div>
            </header>

            {rosterError ? (
              <div className="error-banner">
                <span>{rosterError}</span>
                <button type="button" className="btn btn-sm btn-ghost" onClick={loadRoster}>
                  Retry
                </button>
              </div>
            ) : null}

            <DataTable
              columns={rosterColumns}
              rows={roster}
              loading={rosterLoading}
              emptyTitle="No personnel scheduled"
              emptyMessage={`No duty roster rows found for ${rosterDate || 'the selected date'}.`}
            />

            <div className="actions-row">
              <Link className="btn btn-ghost btn-sm" to="/duty-roster">
                Manage duty roster
              </Link>
            </div>
          </section>
        </>
      )}
    </>
  );
}
