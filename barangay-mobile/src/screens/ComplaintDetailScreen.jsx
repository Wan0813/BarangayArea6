import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import Screen from '../components/Screen';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Loading from '../components/Loading';
import ErrorBanner from '../components/ErrorBanner';
import StatusBadge from '../components/StatusBadge';
import StatusTimeline from '../components/StatusTimeline';
import { complaints, resolveFileUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing } from '../theme';
import { formatDateTime } from '../utils/format';

const COMPLAINT_STEPS = ['Pending', 'Ongoing', 'Resolved'];

export default function ComplaintDetailScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(route.params?.item || null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [detail, thread] = await Promise.all([complaints.getById(id), complaints.comments(id)]);
      setComplaint(detail || complaint);
      const list = Array.isArray(thread) ? thread : thread && thread.items ? thread.items : [];
      setComments(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const sendComment = async () => {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    setError('');
    try {
      await complaints.addComment(id, text);
      setMessage('');
      const thread = await complaints.comments(id);
      const list = Array.isArray(thread) ? thread : thread && thread.items ? thread.items : [];
      setComments(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading && !complaint) return <Loading text="Loading complaint…" />;

  if (!complaint) {
    return (
      <Screen>
        <ErrorBanner message={error || 'Complaint not found.'} onRetry={load} />
        <Button title="Go back" variant="secondary" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  const imageUrl = resolveFileUrl(complaint.imageUrl);
  const timestamps = {
    Pending: formatDateTime(complaint.createdAt),
    Ongoing: complaint.status === 'Ongoing' || complaint.status === 'Resolved' ? formatDateTime(complaint.updatedAt) : '',
    Resolved: complaint.resolvedAt ? formatDateTime(complaint.resolvedAt) : '',
    Rejected: formatDateTime(complaint.updatedAt),
  };

  return (
    <Screen keyboard>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{complaint.subject}</Text>
        <StatusBadge status={complaint.status} />
      </View>
      <Text style={styles.meta}>
        {complaint.type || '—'} · Filed {formatDateTime(complaint.createdAt)}
      </Text>

      <ErrorBanner message={error} onRetry={load} onDismiss={() => setError('')} />

      <Card>
        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.body}>{complaint.description || '—'}</Text>
        {complaint.location ? (
          <>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.body}>{complaint.location}</Text>
          </>
        ) : null}
        {complaint.reporterUsername || complaint.reporterFullName ? (
          <>
            <Text style={styles.label}>Reported by</Text>
            <Text style={styles.body}>
              {complaint.reporterFullName || complaint.reporterUsername}
              {complaint.reporterContact ? ` · ${complaint.reporterContact}` : ''}
            </Text>
          </>
        ) : null}
        {complaint.assignedOfficerName ? (
          <>
            <Text style={styles.label}>Assigned officer</Text>
            <Text style={styles.body}>{complaint.assignedOfficerName}</Text>
          </>
        ) : null}
      </Card>

      {imageUrl ? (
        <Card>
          <Text style={styles.sectionTitle}>Attached photo</Text>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Barangay response</Text>
        {complaint.response ? (
          <Text style={styles.body}>{complaint.response}</Text>
        ) : (
          <Text style={styles.muted}>No response from barangay staff yet.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Status timeline</Text>
        <StatusTimeline status={complaint.status} steps={COMPLAINT_STEPS} rejected="Rejected" timestamps={timestamps} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>
          Comments {comments.length ? `(${comments.length})` : ''}
        </Text>
        {comments.length === 0 ? (
          <Text style={styles.muted}>No comments yet. Ask a question or add an update below.</Text>
        ) : (
          comments.map((comment, index) => (
            <View key={String(comment.id || index)} style={styles.comment}>
              <Text style={styles.commentAuthor}>
                {comment.fullName || comment.username || comment.authorName || 'User'}
                {comment.status ? ` · marked ${comment.status}` : ''}
              </Text>
              <Text style={styles.commentBody}>{comment.message || comment.body || comment.text || ''}</Text>
              <Text style={styles.commentTime}>{formatDateTime(comment.createdAt)}</Text>
            </View>
          ))
        )}

        <Input
          label="Add a comment"
          value={message}
          onChangeText={setMessage}
          placeholder="Type your question or update…"
          multiline
          style={styles.commentInput}
        />
        <Button title="Post comment" onPress={sendComment} loading={sending} />
      </Card>

      {user?.role && user.role !== 'Resident' ? (
        <Text style={styles.muted}>
          You are signed in as {user.role}. Status changes are handled in the admin/desktop system.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, fontSize: fonts.xl, fontWeight: '800', color: colors.text },
  meta: { fontSize: fonts.sm, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  sectionTitle: { fontSize: fonts.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  label: { fontSize: fonts.sm, fontWeight: '700', color: colors.textMuted, marginTop: spacing.md },
  body: { fontSize: fonts.md, color: colors.text, marginTop: spacing.xs },
  muted: { fontSize: fonts.md, color: colors.textMuted },
  image: { width: '100%', height: 220, borderRadius: 10, backgroundColor: colors.neutralSoft },
  comment: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primarySoft,
    paddingLeft: spacing.md,
    marginBottom: spacing.lg,
  },
  commentAuthor: { fontSize: fonts.sm, fontWeight: '700', color: colors.primaryDark },
  commentBody: { fontSize: fonts.md, color: colors.text, marginTop: 2 },
  commentTime: { fontSize: fonts.sm, color: colors.textMuted, marginTop: 2 },
  commentInput: { marginTop: spacing.md },
});
