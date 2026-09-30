import { useEffect, useState } from 'react';
import { users } from '../api/endpoints';

/**
 * Loads barangay staff (Admin + HeadAdmin) for the "assigned officer" selects.
 * Prefers GET /users/staff-options and falls back to the paged users list.
 */
export default function useStaffList() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRole(role) {
      try {
        const data = await users.list({ page: 1, pageSize: 200, role });
        return Array.isArray(data) ? data : data?.items || [];
      } catch {
        return [];
      }
    }

    (async () => {
      let list = [];
      try {
        const options = await users.staffOptions();
        list = Array.isArray(options) ? options : options?.items || [];
      } catch {
        list = [];
      }

      if (list.length === 0) {
        const [heads, admins] = await Promise.all([fetchRole('HeadAdmin'), fetchRole('Admin')]);
        list = [...heads, ...admins];
      }

      const seen = new Set();
      const unique = list.filter((member) => {
        if (!member || member.id === undefined || seen.has(member.id)) return false;
        seen.add(member.id);
        return true;
      });

      if (!cancelled) setStaff(unique);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { staff, loading };
}
