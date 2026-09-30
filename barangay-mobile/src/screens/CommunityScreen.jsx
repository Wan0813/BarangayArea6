import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SearchBar from '../components/SearchBar';
import Card from '../components/Card';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import Pagination from '../components/Pagination';
import Thumbnail from '../components/Thumbnail';
import { announcements, resolveFileUrl } from '../api';
import { config } from '../config';
import { colors, fonts, spacing } from '../theme';
import { formatDateTime } from '../utils/format';

export default function CommunityScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [paging, setPaging] = useState(null);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = useCallback(async (targetPage) => {
    const data = await announcements.list({
      search: submittedSearch || undefined,
      page: targetPage,
      pageSize: config.pageSize,
    });
    setItems((data && data.items) || []);
    setPaging(data || null);
  }, [submittedSearch]);

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
  }, [submittedSearch]);

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

  const header = (
    <View>
      <Text style={styles.title}>Community</Text>
      <Text style={styles.subtitle}>Announcements and updates from the barangay.</Text>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        onSubmit={() => setSubmittedSearch(search.trim())}
        placeholder="Search announcements…"
        onReset={() => {
          setSearch('');
          setSubmittedSearch('');
        }}
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
              title="No announcements"
              message={
                submittedSearch
                  ? 'No announcements match your search. Try Reset.'
                  : 'Barangay announcements will show up here once published.'
              }
            />
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('AnnouncementsDetail', { id: item.id, item })}>
            <View style={styles.row}>
              {item.imageUrl ? <Thumbnail url={resolveFileUrl(item.imageUrl)} size={56} style={styles.thumb} /> : null}
              <View style={styles.flex}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.meta}>{formatDateTime(item.createdAt || item.publishedAt)}</Text>
                {item.body ? (
                  <Text style={styles.body} numberOfLines={3}>
                    {item.body}
                  </Text>
                ) : null}
              </View>
            </View>
            <Text style={styles.readMore}>Read more ›</Text>
          </Card>
        )}
        ListFooterComponent={
          <View>
            {loading && items.length > 0 ? <Loading inline text="Updating…" /> : null}
            {loading && items.length === 0 ? <Loading text="Loading announcements…" /> : null}
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
  title: { fontSize: fonts.xl, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fonts.md, color: colors.textMuted, marginBottom: spacing.md },
  row: { flexDirection: 'row' },
  thumb: { marginRight: spacing.md },
  flex: { flex: 1 },
  itemTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: fonts.sm, color: colors.textMuted, marginTop: 2 },
  body: { fontSize: fonts.md, color: colors.text, marginTop: spacing.sm },
  readMore: { fontSize: fonts.sm, color: colors.primary, fontWeight: '700', marginTop: spacing.md },
});
