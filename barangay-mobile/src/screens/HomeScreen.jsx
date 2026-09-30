import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import ErrorBanner from '../components/ErrorBanner';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { announcements, complaints, emergencies, operations } from '../api';
import { config } from '../config';
import { colors, fonts, spacing } from '../theme';
import { formatDate } from '../utils/format';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [latestAnnouncements, setLatestAnnouncements] = useState([]);
  const [todayOperations, setTodayOperations] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [myEmergencies, setMyEmergencies] = useState([]);

  const load = useCallback(async () => {
    setError('');
    const results = await Promise.allSettled([
      announcements.list({ page: 1, pageSize: 3 }),
      operations.list({ page: 1, pageSize: 3 }),
      complaints.list({ page: 1, pageSize: 3, sortBy: 'date', sortDir: 'desc' }),
      emergencies.list({ page: 1, pageSize: 3 }),
    ]);

    const messages = [];
    const [annRes, opRes, compRes, emRes] = results;

    if (annRes.status === 'fulfilled') {
      setLatestAnnouncements((annRes.value && annRes.value.items) || []);
    } else {
      messages.push(annRes.reason && annRes.reason.message);
    }

    if (opRes.status === 'fulfilled') {
      setTodayOperations((opRes.value && opRes.value.items) || []);
    } else {
      messages.push(opRes.reason && opRes.reason.message);
    }

    if (compRes.status === 'fulfilled') {
      setMyComplaints((compRes.value && compRes.value.items) || []);
    } else {
      messages.push(compRes.reason && compRes.reason.message);
    }

    if (emRes.status === 'fulfilled') {
      setMyEmergencies((emRes.value && emRes.value.items) || []);
    } else {
      messages.push(emRes.reason && emRes.reason.message);
    }

    const firstError = messages.find(Boolean);
    if (firstError) setError(firstError);
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

  if (loading) return <Loading text="Loading your dashboard…" />;

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.container}
    >
      <View style={styles.hero}>
        <Text style={styles.greeting}>Kumusta, {user?.fullName || user?.username || 'resident'}!</Text>
        <Text style={styles.heroSub}>{config.barangayName}</Text>
        <Text style={styles.heroSub}>{config.municipality}</Text>
      </View>

      <ErrorBanner message={error} onRetry={load} onDismiss={() => setError('')} />

      <Card style={styles.emergencyCard}>
        <Text style={styles.emergencyTitle}>Emergency?</Text>
        <Text style={styles.emergencyText}>
          Send an emergency rescue request immediately. Barangay staff are notified in real time.
        </Text>
        <Button
          title="🚨 Send emergency"
          variant="danger"
          onPress={() => navigation.navigate('Emergency', { focus: true })}
        />
      </Card>

      <View style={styles.quickRow}>
        <View style={styles.quickItem}>
          <Button title="File a complaint" onPress={() => navigation.navigate('SubmitComplaint')} />
        </View>
        <View style={styles.quickGap} />
        <View style={styles.quickItem}>
          <Button
            title="View operations"
            variant="secondary"
            onPress={() => navigation.navigate('Operations')}
          />
        </View>
      </View>

      <Button
        title="🔔 Activity on my complaints & requests"
        variant="secondary"
        onPress={() => navigation.navigate('Notifications')}
      />

      <SectionHeader
        title="Latest announcements"
        onSeeAll={() => navigation.navigate('Community')}
      />
      {latestAnnouncements.length === 0 ? (
        <Text style={styles.emptyText}>No announcements yet.</Text>
      ) : (
        latestAnnouncements.map((item) => (
          <Card key={String(item.id)} onPress={() => navigation.navigate('AnnouncementsDetail', { id: item.id, item })}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>{formatDate(item.createdAt || item.publishedAt || item.date)}</Text>
            {item.body ? (
              <Text style={styles.itemBody} numberOfLines={2}>
                {item.body}
              </Text>
            ) : null}
          </Card>
        ))
      )}

      <SectionHeader title="Daily operations" onSeeAll={() => navigation.navigate('Operations')} />
      {todayOperations.length === 0 ? (
        <Text style={styles.emptyText}>No published operations yet.</Text>
      ) : (
        todayOperations.map((item) => (
          <Card key={String(item.id)}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>
              {formatDate(item.date)} · {String(item.category || '').replace(/([A-Z])/g, ' $1').trim()}
            </Text>
          </Card>
        ))
      )}

      <SectionHeader title="My latest complaints" onSeeAll={() => navigation.navigate('Complaints')} />
      {myComplaints.length === 0 ? (
        <Text style={styles.emptyText}>You have not filed a complaint yet.</Text>
      ) : (
        myComplaints.map((item) => (
          <Card
            key={String(item.id)}
            onPress={() => navigation.navigate('ComplaintDetail', { id: item.id })}
          >
            <View style={styles.cardTopRow}>
              <Text style={[styles.itemTitle, styles.flex]} numberOfLines={1}>
                {item.subject}
              </Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.itemMeta}>
              {item.type} · {formatDate(item.createdAt)}
            </Text>
          </Card>
        ))
      )}

      <SectionHeader title="My emergency requests" onSeeAll={() => navigation.navigate('Emergency')} />
      {myEmergencies.length === 0 ? (
        <Text style={styles.emptyText}>No emergency requests on record.</Text>
      ) : (
        myEmergencies.map((item) => (
          <Card key={String(item.id)}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.itemTitle, styles.flex]} numberOfLines={1}>
                {item.kind}
              </Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.itemMeta}>
              {item.location || '—'} · {formatDate(item.createdAt)}
            </Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

function SectionHeader({ title, onSeeAll }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll ? <Button title="See all" size="sm" variant="ghost" onPress={onSeeAll} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xxl },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  greeting: { color: colors.white, fontSize: fonts.xl, fontWeight: '800' },
  heroSub: { color: colors.primarySoft, fontSize: fonts.sm, marginTop: 2 },
  emergencyCard: { borderColor: colors.danger, borderWidth: 2 },
  emergencyTitle: { fontSize: fonts.lg, fontWeight: '800', color: colors.danger },
  emergencyText: { fontSize: fonts.md, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md },
  quickRow: { flexDirection: 'row', marginBottom: spacing.lg },
  quickItem: { flex: 1 },
  quickGap: { width: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  sectionTitle: { fontSize: fonts.lg, fontWeight: '700', color: colors.text },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  flex: { flex: 1 },
  itemTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  itemMeta: { fontSize: fonts.sm, color: colors.textMuted, marginTop: 2 },
  itemBody: { fontSize: fonts.md, color: colors.text, marginTop: spacing.sm },
  emptyText: { fontSize: fonts.md, color: colors.textMuted, marginBottom: spacing.md },
});
