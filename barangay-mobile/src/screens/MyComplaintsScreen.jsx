import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SearchBar from '../components/SearchBar';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import Pagination from '../components/Pagination';
import Thumbnail from '../components/Thumbnail';
import { complaints, resolveFileUrl } from '../api';
import { config } from '../config';
import { colors, fonts, spacing } from '../theme';
import { formatDate } from '../utils/format';

const STATUS_OPTIONS = ['Pending', 'Ongoing', 'Resolved', 'Rejected'];

export default function MyComplaintsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [page, setPage] = useState(1);
  const [paging, setPaging] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = useCallback(
    async (targetPage, params) => {
      setError('');
      const data = await complaints.list({
        search: params.search || undefined,
        status: params.status || undefined,
        type: params.type || undefined,
        page: targetPage,
        pageSize: config.pageSize,
        sortBy: 'date',
        sortDir: 'desc',
      });
      setItems((data && data.items) || []);
      setPaging(data || null);
      setPage((data && data.page) || targetPage);
    },
    []
  );

  const load = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      try {
        await fetchPage(targetPage, { search: submittedSearch, status, type });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchPage, submittedSearch, status, type]
  );

  // Load suggested complaint types once (fall back to sensible defaults).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await complaints.types();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data && data.items ? data.items : [];
        const normalized = list
          .map((entry) => (typeof entry === 'string' ? entry : entry && (entry.type || entry.name)))
          .filter(Boolean);
        setTypes(normalized);
      } catch (e) {
        // Suggestions are optional.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Refetch whenever the applied search/filters change.
  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedSearch, status, type]);

  const applySearch = () => setSubmittedSearch(search.trim());

  const reset = () => {
    setSearch('');
    setStatus('');
    setType('');
    setSubmittedSearch('');
    setPage(1);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPage(page, { search: submittedSearch, status, type });
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  const goToPage = async (next) => {
    try {
      setLoading(true);
      await fetchPage(next, { search: submittedSearch, status, type });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My complaints</Text>
        <Button title="+ New" size="sm" onPress={() => navigation.navigate('SubmitComplaint')} />
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        onSubmit={applySearch}
        placeholder="Search subject, type, location…"
        filters={[
          { key: 'status', label: 'Status', value: status, options: STATUS_OPTIONS },
          {
            key: 'type',
            label: 'Type',
            value: type,
            options: types.length > 0 ? types : ['Place Complaint', 'Person Complaint', 'Noise/Cleanliness', 'Other'],
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === 'status') setStatus(value);
          if (key === 'type') setType(value);
        }}
        onReset={reset}
      />

      <ErrorBanner message={error} onRetry={() => load(1)} onDismiss={() => setError('')} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title="No complaints found"
              message={
                submittedSearch || status || type
                  ? 'Try clearing the search or filters with Reset.'
                  : 'File your first complaint to get started.'
              }
              actionTitle="File a complaint"
              onAction={() => navigation.navigate('SubmitComplaint')}
            />
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('ComplaintDetail', { id: item.id })}>
            <View style={styles.cardRow}>
              {item.imageUrl ? (
                <Thumbnail url={resolveFileUrl(item.imageUrl)} size={56} style={styles.thumb} />
              ) : null}
              <View style={styles.flex}>
                <View style={styles.cardTop}>
                  <Text style={[styles.subject, styles.flex]} numberOfLines={2}>
                    {item.subject}
                  </Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={styles.meta}>{item.type || '—'}</Text>
                <Text style={styles.meta}>{item.location || 'No location given'}</Text>
                <Text style={styles.meta}>
                  Filed {formatDate(item.createdAt)}
                  {item.commentCount ? ` · ${item.commentCount} comment(s)` : ''}
                </Text>
              </View>
            </View>
            {item.response ? (
              <View style={styles.response}>
                <Text style={styles.responseLabel}>Barangay response</Text>
                <Text style={styles.responseText} numberOfLines={2}>
                  {item.response}
                </Text>
              </View>
            ) : null}
          </Card>
        )}
        ListFooterComponent={
          <View>
            {loading && items.length > 0 ? <Loading inline text="Updating…" /> : null}
            {loading && items.length === 0 ? <Loading text="Loading your complaints…" /> : null}
            {paging ? (
              <Pagination
                page={paging.page}
                totalPages={paging.totalPages}
                hasNext={paging.hasNext}
                hasPrevious={paging.hasPrevious}
                totalItems={paging.totalItems}
                onPageChange={goToPage}
              />
            ) : null}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { fontSize: fonts.xl, fontWeight: '800', color: colors.text },
  cardRow: { flexDirection: 'row' },
  thumb: { marginRight: spacing.md },
  flex: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs },
  subject: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginRight: spacing.sm },
  meta: { fontSize: fonts.sm, color: colors.textMuted, marginTop: 2 },
  response: {
    marginTop: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    padding: spacing.md,
  },
  responseLabel: { fontSize: fonts.sm, fontWeight: '700', color: colors.primaryDark },
  responseText: { fontSize: fonts.sm, color: colors.text, marginTop: 2 },
});
