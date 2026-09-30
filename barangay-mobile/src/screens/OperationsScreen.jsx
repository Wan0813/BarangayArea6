import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SearchBar from '../components/SearchBar';
import Card from '../components/Card';
import Input from '../components/Input';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import Pagination from '../components/Pagination';
import Thumbnail from '../components/Thumbnail';
import StatusBadge from '../components/StatusBadge';
import { operations, resolveFileUrl } from '../api';
import { config } from '../config';
import { colors, fonts, spacing } from '../theme';
import { formatDate } from '../utils/format';

const CATEGORIES = [
  'PatrolPeaceAndOrder',
  'Cleanliness',
  'HealthServices',
  'Meeting',
  'ResidentServices',
  'Other',
];

function humanizeCategory(value) {
  if (!value) return 'Uncategorized';
  return String(value).replace(/([A-Z])/g, ' $1').trim();
}

export default function OperationsScreen() {
  const [items, setItems] = useState([]);
  const [paging, setPaging] = useState(null);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [dates, setDates] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchPage = useCallback(
    async (targetPage) => {
      const data = await operations.list({
        search: submittedSearch || undefined,
        category: category || undefined,
        from: dates.from || undefined,
        to: dates.to || undefined,
        page: targetPage,
        pageSize: config.pageSize,
      });
      setItems((data && data.items) || []);
      setPaging(data || null);
    },
    [submittedSearch, category, dates]
  );

  const load = useCallback(
    async (targetPage = 1) => {
      setError('');
      setLoading(true);
      try {
        await fetchPage(targetPage);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchPage]
  );

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedSearch, category, dates]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPage(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  const applySearch = () => {
    setSubmittedSearch(search.trim());
    setDates({ from: from.trim(), to: to.trim() });
  };

  const reset = () => {
    setSearch('');
    setSubmittedSearch('');
    setCategory('');
    setFrom('');
    setTo('');
    setDates({ from: '', to: '' });
  };

  const header = (
    <View>
      <Text style={styles.title}>Daily operations</Text>
      <Text style={styles.subtitle}>Published activities, patrols and services in the barangay.</Text>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        onSubmit={applySearch}
        placeholder="Search title, details, personnel…"
        filters={[
          {
            key: 'category',
            label: 'Category',
            value: category,
            options: CATEGORIES.map((value) => ({ value, label: humanizeCategory(value) })),
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === 'category') setCategory(value);
        }}
        onReset={reset}
      >
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Input
              label="From (YYYY-MM-DD)"
              value={from}
              onChangeText={setFrom}
              placeholder="2026-01-01"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.dateGap} />
          <View style={styles.dateField}>
            <Input
              label="To (YYYY-MM-DD)"
              value={to}
              onChangeText={setTo}
              placeholder="2026-12-31"
              autoCapitalize="none"
            />
          </View>
        </View>
      </SearchBar>

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
              title="No operations found"
              message="No published operations match your search or filters. Try Reset."
            />
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => {
          const isOpen = expanded === item.id;
          return (
            <Card>
              <View style={styles.row}>
                {item.imageUrl ? (
                  <Thumbnail url={resolveFileUrl(item.imageUrl)} size={56} style={styles.thumb} />
                ) : null}
                <View style={styles.flex}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.meta}>
                    {formatDate(item.date)} · {humanizeCategory(item.category)}
                  </Text>
                </View>
              </View>

              <View style={styles.badges}>
                <StatusBadge status={item.isPublished ? 'Published' : 'Draft'} />
              </View>

              {item.details ? (
                <Text style={styles.body} numberOfLines={isOpen ? undefined : 2}>
                  {item.details}
                </Text>
              ) : null}

              {item.personnelInvolved || item.assignedOfficerName || item.assignedStaffName ? (
                <View style={styles.officers}>
                  {item.assignedOfficerName ? (
                    <Text style={styles.meta}>Officer: {item.assignedOfficerName}</Text>
                  ) : null}
                  {item.assignedStaffName ? (
                    <Text style={styles.meta}>Staff: {item.assignedStaffName}</Text>
                  ) : null}
                  {item.personnelInvolved ? (
                    <Text style={styles.meta}>Personnel: {item.personnelInvolved}</Text>
                  ) : null}
                </View>
              ) : null}

              {item.details ? (
                <Text style={styles.toggle} onPress={() => setExpanded(isOpen ? null : item.id)}>
                  {isOpen ? 'Show less' : 'Show more'}
                </Text>
              ) : null}
            </Card>
          );
        }}
        ListFooterComponent={
          <View>
            <View style={styles.dateApply}>
              <Text style={styles.meta}>Tap Search to apply the date filters.</Text>
            </View>
            {loading && items.length > 0 ? <Loading inline text="Updating…" /> : null}
            {loading && items.length === 0 ? <Loading text="Loading operations…" /> : null}
            {paging ? (
              <Pagination
                page={paging.page}
                totalPages={paging.totalPages}
                hasNext={paging.hasNext}
                hasPrevious={paging.hasPrevious}
                totalItems={paging.totalItems}
                onPageChange={(next) => load(next)}
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
  title: { fontSize: fonts.xl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fonts.md, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md },
  dateRow: { flexDirection: 'row', marginTop: spacing.sm, alignItems: 'flex-end' },
  dateField: { flex: 1 },
  dateGap: { width: spacing.md },
  row: { flexDirection: 'row' },
  thumb: { marginRight: spacing.md },
  flex: { flex: 1 },
  itemTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: fonts.sm, color: colors.textMuted, marginTop: 2 },
  badges: { marginTop: spacing.sm },
  body: { fontSize: fonts.md, color: colors.text, marginTop: spacing.sm },
  officers: { marginTop: spacing.sm },
  toggle: { fontSize: fonts.sm, color: colors.primary, fontWeight: '700', marginTop: spacing.md },
  dateApply: { alignItems: 'center', marginTop: spacing.md },
});
