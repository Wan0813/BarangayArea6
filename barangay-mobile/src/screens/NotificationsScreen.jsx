import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import StatusBadge from '../components/StatusBadge';
import { complaints, emergencies } from '../api';
import { config } from '../config';
import { colors, fonts, radius, spacing } from '../theme';
import { formatDateTime } from '../utils/format';

/**
 * Activity feed. The API has no dedicated notifications endpoint, so this
 * screen derives recent activity from the resident's own complaints and
 * emergency requests (status changes, barangay responses, new comments).
 */
export default function NotificationsScreen({ navigation }) {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const results = await Promise.allSettled([
      complaints.list({ page: 1, pageSize: 10, sortBy: 'date', sortDir: 'desc' }),
      emergencies.list({ page: 1, pageSize: 10 }),
    ]);

    const feed = [];
    const [compRes, emRes] = results;

    if (compRes.status === 'fulfilled') {
      ((compRes.value && compRes.value.items) || []).forEach((item) => {
        feed.push({
          key: `c-${item.id}`,
          kind: 'Complaint',
          title: item.subject,
          status: item.status,
          detail: item.response || 'No response yet.',
          at: item.updatedAt || item.createdAt,
          target: { screen: 'ComplaintDetail', params: { id: item.id, item } },
        });
      });
    } else {
      setError((prev) => prev || (compRes.reason && compRes.reason.message) || '');
    }

    if (emRes.status === 'fulfilled') {
      ((emRes.value && emRes.value.items) || []).forEach((item) => {
        feed.push({
          key: `e-${item.id}`,
          kind: 'Emergency',
          title: item.kind,
          status: item.status,
          detail: item.response || (item.eta ? `ETA: ${item.eta}` : 'No response yet.'),
          at: item.updatedAt || item.createdAt,
          target: null,
        });
      });
    } else {
      setError((prev) => prev || (emRes.reason && emRes.reason.message) || '');
    }

    feed.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
    setActivity(feed);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <Loading text="Loading activity…" />;

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Activity</Text>
      <Text style={styles.subtitle}>Recent updates on your complaints and emergency requests.</Text>

      <ErrorBanner message={error} onRetry={load} onDismiss={() => setError('')} />

      {activity.length === 0 ? (
        <EmptyState
          title="No activity yet"
          message="Updates from barangay staff will appear here."
          actionTitle="File a complaint"
          onAction={() => navigation.navigate('SubmitComplaint')}
        />
      ) : (
        activity.map((entry) => (
          <Card
            key={entry.key}
            onPress={entry.target ? () => navigation.navigate(entry.target.screen, entry.target.params) : undefined}
          >
            <View style={styles.row}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{entry.kind}</Text>
              </View>
              <View style={styles.flex} />
              <StatusBadge status={entry.status} />
            </View>
            <Text style={styles.itemTitle}>{entry.title}</Text>
            <Text style={styles.detail}>{entry.detail}</Text>
            <Text style={styles.meta}>{formatDateTime(entry.at)}</Text>
          </Card>
        ))
      )}

      <View style={styles.footerRow}>
        <Button title="Daily operations" variant="secondary" onPress={() => navigation.navigate('Operations')} />
        <View style={styles.gap} />
        <Button title="About us" variant="secondary" onPress={() => navigation.navigate('About')} />
      </View>

      <Text style={styles.footerNote}>{config.barangayName}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fonts.xl, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  subtitle: { fontSize: fonts.md, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  chip: {
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
  },
  chipText: { fontSize: fonts.sm, color: colors.textMuted, fontWeight: '700' },
  flex: { flex: 1 },
  itemTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  detail: { fontSize: fonts.md, color: colors.text, marginTop: spacing.xs },
  meta: { fontSize: fonts.sm, color: colors.textMuted, marginTop: spacing.sm },
  footerRow: { flexDirection: 'row', marginTop: spacing.md },
  gap: { width: spacing.md },
  footerNote: { textAlign: 'center', color: colors.textMuted, fontSize: fonts.sm, marginTop: spacing.lg },
});
