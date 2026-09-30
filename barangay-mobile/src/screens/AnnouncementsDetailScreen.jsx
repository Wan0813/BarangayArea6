import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import Screen from '../components/Screen';
import Button from '../components/Button';
import Loading from '../components/Loading';
import ErrorBanner from '../components/ErrorBanner';
import { announcements, resolveFileUrl } from '../api';
import { colors, fonts, spacing } from '../theme';
import { formatDateTime } from '../utils/format';

export default function AnnouncementsDetailScreen({ route }) {
  const { id, item } = route.params || {};
  const [announcement, setAnnouncement] = useState(item || null);
  const [loading, setLoading] = useState(!item);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await announcements.getById(id);
      setAnnouncement(data || item);
    } catch (e) {
      // Fall back to the list payload we already have, if any.
      if (!item) setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, item]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !announcement) return <Loading text="Loading announcement…" />;

  if (!announcement) {
    return (
      <Screen>
        <ErrorBanner message={error || 'Announcement not found.'} onRetry={load} />
        <Button title="Retry" variant="secondary" onPress={load} />
      </Screen>
    );
  }

  const imageUrl = resolveFileUrl(announcement.imageUrl);

  return (
    <Screen>
      <Text style={styles.title}>{announcement.title}</Text>
      <Text style={styles.meta}>
        {formatDateTime(announcement.createdAt || announcement.publishedAt || announcement.date)}
        {announcement.createdByName ? ` · ${announcement.createdByName}` : ''}
      </Text>

      {error ? <ErrorBanner message={error} onRetry={load} style={styles.banner} /> : null}

      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" /> : null}

      <Text style={styles.body}>{announcement.body || '—'}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fonts.xxl, fontWeight: '800', color: colors.text },
  meta: { fontSize: fonts.sm, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  banner: { marginTop: spacing.md },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: spacing.lg,
    backgroundColor: colors.neutralSoft,
  },
  body: { fontSize: fonts.lg, color: colors.text, lineHeight: 24 },
});
