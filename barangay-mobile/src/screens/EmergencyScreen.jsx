import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SearchBar from '../components/SearchBar';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import Pagination from '../components/Pagination';
import Thumbnail from '../components/Thumbnail';
import ComboSelect from '../components/ComboSelect';
import ImagePickerField from '../components/ImagePickerField';
import StatusTimeline from '../components/StatusTimeline';
import { about, emergencies, publicApi, resolveFileUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import { config } from '../config';
import { colors, fonts, radius, spacing } from '../theme';
import { formatDateTime } from '../utils/format';

const KINDS = ['Fire', 'Medical Emergency', 'Flood/Disaster', 'Accident', 'Crime/Danger', 'Other'];
const STATUS_OPTIONS = ['Pending', 'Approved', 'Processing', 'Declined'];
const EMERGENCY_STEPS = ['Pending', 'Approved', 'Processing'];

export default function EmergencyScreen({ route, navigation }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('requests');

  const [items, setItems] = useState([]);
  const [paging, setPaging] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [hotlines, setHotlines] = useState([]);
  const [hotlinesLoading, setHotlinesLoading] = useState(false);
  const [hotlinesError, setHotlinesError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [kind, setKind] = useState('');
  const [location, setLocation] = useState(user?.address || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (route?.params?.focus) setFormOpen(true);
  }, [route?.params?.focus]);

  const fetchPage = useCallback(async (targetPage, params) => {
    const data = await emergencies.list({
      search: params.search || undefined,
      status: params.status || undefined,
      page: targetPage,
      pageSize: config.pageSize,
    });
    setItems((data && data.items) || []);
    setPaging(data || null);
  }, []);

  const load = useCallback(
    async (targetPage = 1) => {
      setError('');
      setLoading(true);
      try {
        await fetchPage(targetPage, { search: submittedSearch, status });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchPage, submittedSearch, status]
  );

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedSearch, status]);

  const loadHotlines = useCallback(async () => {
    setHotlinesError('');
    setHotlinesLoading(true);
    try {
      let data = null;
      try {
        data = await about.hotlines();
      } catch (e) {
        data = await publicApi.hotlines();
      }
      const list = Array.isArray(data) ? data : data && data.items ? data.items : [];
      setHotlines(list);
    } catch (e) {
      setHotlinesError(e.message);
    } finally {
      setHotlinesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'hotlines' && hotlines.length === 0) loadHotlines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const submitEmergency = async () => {
    setFormError('');
    const errors = {};
    if (!kind.trim()) errors.kind = 'Select or type the kind of emergency.';
    if (!contactNumber.trim()) errors.contactNumber = 'A contact number is required so we can reach you.';
    if (!location.trim()) errors.location = 'Tell us where to respond.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Please complete the required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await emergencies.create(
        {
          kind: kind.trim(),
          location: location.trim(),
          contactNumber: contactNumber.trim(),
          description: description.trim(),
        },
        image
      );
      setFormOpen(false);
      setKind('');
      setDescription('');
      setImage(null);
      Alert.alert('Emergency request sent', 'Barangay staff have been alerted. Keep your phone reachable.', [
        { text: 'OK' },
      ]);
      load(1);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const call = async (number) => {
    if (!number) return;
    const cleaned = String(number).replace(/[^\d+*#]/g, '');
    const url = `tel:${cleaned}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Cannot place call', `Please dial ${number} manually.`);
    } catch (e) {
      Alert.alert('Cannot place call', `Please dial ${number} manually.`);
    }
  };

  const reset = () => {
    setSearch('');
    setStatus('');
    setSubmittedSearch('');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (tab === 'requests') await fetchPage(1, { search: submittedSearch, status });
      else await loadHotlines();
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  const requestHeader = (
    <View>
      <Pressable style={styles.emergencyButton} onPress={() => setFormOpen(true)} accessibilityRole="button">
        <Text style={styles.emergencyButtonText}>🚨 SEND EMERGENCY</Text>
        <Text style={styles.emergencyButtonSub}>Tap to request rescue / assistance now</Text>
      </Pressable>

      <View style={styles.tabs}>
        <TabButton label="My requests" active={tab === 'requests'} onPress={() => setTab('requests')} />
        <TabButton label="Hotlines" active={tab === 'hotlines'} onPress={() => setTab('hotlines')} />
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        onSubmit={() => setSubmittedSearch(search.trim())}
        placeholder="Search kind, location, description…"
        filters={[{ key: 'status', label: 'Status', value: status, options: STATUS_OPTIONS }]}
        onFilterChange={(key, value) => {
          if (key === 'status') setStatus(value);
        }}
        onReset={reset}
      />

      <ErrorBanner message={error} onRetry={() => load(1)} onDismiss={() => setError('')} />
    </View>
  );

  if (tab === 'hotlines') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Pressable style={styles.emergencyButton} onPress={() => setFormOpen(true)} accessibilityRole="button">
            <Text style={styles.emergencyButtonText}>🚨 SEND EMERGENCY</Text>
            <Text style={styles.emergencyButtonSub}>Tap to request rescue / assistance now</Text>
          </Pressable>

          <View style={styles.tabs}>
            <TabButton label="My requests" active={false} onPress={() => setTab('requests')} />
            <TabButton label="Hotlines" active onPress={() => setTab('hotlines')} />
          </View>

          <ErrorBanner message={hotlinesError} onRetry={loadHotlines} onDismiss={() => setHotlinesError('')} />

          {hotlinesLoading ? <Loading text="Loading hotlines…" /> : null}

          {!hotlinesLoading && hotlines.length === 0 ? (
            <EmptyState
              title="No hotlines available"
              message={`Call the barangay office for emergencies${config.contactNumber ? ` at ${config.contactNumber}` : ''}.`}
            />
          ) : null}

          {hotlines.map((line, index) => (
            <Card key={String(line.id || index)}>
              <Text style={styles.hotlineName}>{line.name || line.label || line.agency || 'Hotline'}</Text>
              {line.description || line.details ? (
                <Text style={styles.meta}>{line.description || line.details}</Text>
              ) : null}
              <Text style={styles.hotlineNumber}>{line.number || line.contactNumber || line.phone || '—'}</Text>
              <Button
                title={`📞 Call ${line.number || line.contactNumber || ''}`}
                variant="danger"
                size="sm"
                onPress={() => call(line.number || line.contactNumber || line.phone)}
              />
            </Card>
          ))}

          <Card>
            <Text style={styles.hotlineName}>{config.barangayName}</Text>
            <Text style={styles.meta}>{config.municipality}</Text>
            {config.contactNumber ? <Text style={styles.hotlineNumber}>{config.contactNumber}</Text> : null}
            <Text style={styles.meta}>{config.officeHours}</Text>
          </Card>
        </ScrollView>

        {renderForm()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={requestHeader}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              title="No emergency requests"
              message="Your emergency requests will appear here with their status, ETA and the barangay's response."
              actionTitle="Send emergency"
              onAction={() => setFormOpen(true)}
            />
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <Card onPress={() => setSelected(item)}>
            <View style={styles.cardRow}>
              {item.imageUrl ? (
                <Thumbnail url={resolveFileUrl(item.imageUrl)} size={56} style={styles.thumb} />
              ) : null}
              <View style={styles.flex}>
                <View style={styles.cardTop}>
                  <Text style={[styles.kind, styles.flex]} numberOfLines={1}>
                    {item.kind}
                  </Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={styles.meta}>{item.location || 'No location given'}</Text>
                <Text style={styles.meta}>Sent {formatDateTime(item.createdAt)}</Text>
                {item.eta ? <Text style={styles.eta}>ETA: {item.eta}</Text> : null}
              </View>
            </View>
            {item.response ? (
              <View style={styles.response}>
                <Text style={styles.responseLabel}>Barangay response</Text>
                <Text style={styles.responseText} numberOfLines={3}>
                  {item.response}
                </Text>
              </View>
            ) : null}
          </Card>
        )}
        ListFooterComponent={
          <View>
            {loading && items.length > 0 ? <Loading inline text="Updating…" /> : null}
            {loading && items.length === 0 ? <Loading text="Loading your emergency requests…" /> : null}
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

      <Modal
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Emergency: ${selected.kind}` : 'Emergency'}
      >
        {selected ? (
          <View>
            <StatusBadge status={selected.status} />
            <Text style={styles.detailLabel}>Sent</Text>
            <Text style={styles.body}>{formatDateTime(selected.createdAt)}</Text>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.body}>{selected.location || '—'}</Text>
            <Text style={styles.detailLabel}>Contact</Text>
            <Text style={styles.body}>{selected.contactNumber || '—'}</Text>
            {selected.description ? (
              <>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.body}>{selected.description}</Text>
              </>
            ) : null}
            {selected.eta ? (
              <>
                <Text style={styles.detailLabel}>ETA</Text>
                <Text style={styles.body}>{selected.eta}</Text>
              </>
            ) : null}
            <Text style={styles.detailLabel}>Barangay response</Text>
            <Text style={styles.body}>{selected.response || 'No response yet.'}</Text>
            {selected.assignedOfficerName ? (
              <>
                <Text style={styles.detailLabel}>Responder</Text>
                <Text style={styles.body}>{selected.assignedOfficerName}</Text>
              </>
            ) : null}
            {resolveFileUrl(selected.imageUrl) ? (
              <Image source={{ uri: resolveFileUrl(selected.imageUrl) }} style={styles.detailImage} resizeMode="cover" />
            ) : null}
            <Text style={styles.detailLabel}>Status timeline</Text>
            <StatusTimeline status={selected.status} steps={EMERGENCY_STEPS} rejected="Declined" />
          </View>
        ) : null}
      </Modal>

      {renderForm()}
    </SafeAreaView>
  );

  function renderForm() {
    return (
      <Modal
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        title="Send an emergency request"
        footer={
          <View style={styles.formFooter}>
            <Button title="🚨 Send emergency" variant="danger" onPress={submitEmergency} loading={submitting} size="lg" />
            <Button title="Cancel" variant="secondary" onPress={() => setFormOpen(false)} />
          </View>
        }
      >
        <Text style={styles.formIntro}>
          Use this only for real emergencies. Barangay staff receive your request immediately.
        </Text>

        <ErrorBanner message={formError} onDismiss={() => setFormError('')} />

        <ComboSelect
          label="Kind of emergency"
          value={kind}
          onChange={setKind}
          suggestions={KINDS}
          placeholder="Type the kind of emergency"
          required
          hint="Pick a suggestion or tap ✎ Custom to type your own."
        />
        {fieldErrors.kind ? <Text style={styles.fieldError}>{fieldErrors.kind}</Text> : null}

        <Input
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="Where should responders go?"
          required
          error={fieldErrors.location}
        />
        <Input
          label="Contact number"
          value={contactNumber}
          onChangeText={setContactNumber}
          placeholder="09XXXXXXXXX"
          keyboardType="phone-pad"
          required
          error={fieldErrors.contactNumber}
        />
        <Input
          label="What is happening?"
          value={description}
          onChangeText={setDescription}
          placeholder="Briefly describe the situation…"
          multiline
        />
        <ImagePickerField label="Attach a photo (optional)" value={image} onChange={setImage} />
      </Modal>
    );
  }
}

function TabButton({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emergencyButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  emergencyButtonText: { color: colors.white, fontSize: fonts.xl, fontWeight: '900', letterSpacing: 0.5 },
  emergencyButtonSub: { color: colors.dangerSoft, fontSize: fonts.sm, marginTop: spacing.xs },
  tabs: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: fonts.md, color: colors.text, fontWeight: '600' },
  tabTextActive: { color: colors.white },
  cardRow: { flexDirection: 'row' },
  thumb: { marginRight: spacing.md },
  flex: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xs },
  kind: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginRight: spacing.sm },
  meta: { fontSize: fonts.sm, color: colors.textMuted, marginTop: 2 },
  eta: { fontSize: fonts.sm, color: colors.info, fontWeight: '700', marginTop: spacing.xs },
  response: { marginTop: spacing.md, backgroundColor: colors.primarySoft, borderRadius: 10, padding: spacing.md },
  responseLabel: { fontSize: fonts.sm, fontWeight: '700', color: colors.primaryDark },
  responseText: { fontSize: fonts.sm, color: colors.text, marginTop: 2 },
  hotlineName: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  hotlineNumber: { fontSize: fonts.lg, fontWeight: '800', color: colors.danger, marginVertical: spacing.sm },
  detailLabel: { fontSize: fonts.sm, fontWeight: '700', color: colors.textMuted, marginTop: spacing.md },
  body: { fontSize: fonts.md, color: colors.text, marginTop: 2 },
  detailImage: { width: '100%', height: 200, borderRadius: 10, marginTop: spacing.md, backgroundColor: colors.neutralSoft },
  formIntro: { fontSize: fonts.md, color: colors.textMuted, marginBottom: spacing.md },
  formFooter: { gap: spacing.sm },
  fieldError: { color: colors.danger, fontSize: fonts.sm, marginTop: -spacing.sm, marginBottom: spacing.md },
});
