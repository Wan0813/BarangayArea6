import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import { about } from '../api';
import { config } from '../config';
import { colors, fonts, radius, spacing } from '../theme';

export default function AboutScreen() {
  const [data, setData] = useState(null);
  const [hotlines, setHotlines] = useState([]);
  const [organization, setOrganization] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const payload = await about.get();
      const info = payload && payload.about ? payload.about : payload || {};
      setData(info);
      const lines = (payload && payload.hotlines) || [];
      setHotlines(Array.isArray(lines) ? lines : []);
      const org = (payload && payload.organization) || [];
      setOrganization(Array.isArray(org) ? org : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const call = async (number) => {
    if (!number) return;
    const cleaned = String(number).replace(/[^\d+*#]/g, '');
    try {
      const supported = await Linking.canOpenURL(`tel:${cleaned}`);
      if (supported) await Linking.openURL(`tel:${cleaned}`);
      else Alert.alert('Cannot place call', `Please dial ${number} manually.`);
    } catch (e) {
      Alert.alert('Cannot place call', `Please dial ${number} manually.`);
    }
  };

  if (loading) return <Loading text="Loading barangay information…" />;

  const name = (data && (data.name || data.barangayName)) || config.barangayName;
  const municipality = (data && data.municipality) || config.municipality;
  const mission = data && (data.mission || data.aboutMission);
  const vision = data && (data.vision || data.aboutVision);
  const history = data && (data.history || data.description || data.about);
  const officeHours = (data && data.officeHours) || config.officeHours;
  const contactEmail = (data && data.contactEmail) || config.contactEmail;
  const contactNumber = (data && (data.contactNumber || data.contact)) || config.contactNumber;

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.heroName}>{name}</Text>
        <Text style={styles.heroSub}>{municipality}</Text>
      </View>

      <ErrorBanner message={error} onRetry={load} onDismiss={() => setError('')} />

      <Card>
        <Text style={styles.sectionTitle}>Mission</Text>
        <Text style={styles.body}>{mission || 'Mission statement is not available yet.'}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Vision</Text>
        <Text style={styles.body}>{vision || 'Vision statement is not available yet.'}</Text>
      </Card>

      {history ? (
        <Card>
          <Text style={styles.sectionTitle}>About the barangay</Text>
          <Text style={styles.body}>{history}</Text>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Office information</Text>
        <Text style={styles.label}>Office hours</Text>
        <Text style={styles.body}>{officeHours || '—'}</Text>
        {contactNumber ? (
          <>
            <Text style={styles.label}>Contact number</Text>
            <Text style={styles.body}>{contactNumber}</Text>
            <View style={styles.inlineButton}>
              <Button title="📞 Call office" size="sm" variant="secondary" onPress={() => call(contactNumber)} />
            </View>
          </>
        ) : null}
        {contactEmail ? (
          <>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.body}>{contactEmail}</Text>
          </>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Emergency hotlines</Text>
        {hotlines.length === 0 ? (
          <Text style={styles.muted}>No hotlines have been published yet.</Text>
        ) : (
          hotlines.map((line, index) => (
            <View key={String(line.id || index)} style={styles.hotline}>
              <Text style={styles.hotlineName}>{line.name || line.label || line.agency || 'Hotline'}</Text>
              {line.description ? <Text style={styles.muted}>{line.description}</Text> : null}
              <Text style={styles.hotlineNumber}>{line.number || line.contactNumber || '—'}</Text>
              <Button
                title="📞 Call"
                size="sm"
                variant="danger"
                onPress={() => call(line.number || line.contactNumber)}
              />
            </View>
          ))
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Organization chart</Text>
        {organization.length === 0 ? (
          <EmptyState title="No organization data" message="The organizational chart is not available yet." />
        ) : (
          organization.map((node) => <OrgNode key={String(node.id)} node={node} depth={0} />)
        )}
      </Card>

      <Text style={styles.footerNote}>
        {config.appName} · v1.0.0
      </Text>
    </Screen>
  );
}

function OrgNode({ node, depth }) {
  const children = node.children || node.members || [];
  return (
    <View style={{ marginLeft: depth * 16 }}>
      <View style={[styles.orgCard, depth > 0 && styles.orgCardChild]}>
        <Text style={styles.orgName}>{node.name || node.fullName || node.position || '—'}</Text>
        {node.position && node.name ? <Text style={styles.muted}>{node.position}</Text> : null}
        {node.role ? <Text style={styles.muted}>{node.role}</Text> : null}
      </View>
      {children.map((child, index) => (
        <OrgNode key={String(child.id || index)} node={child} depth={depth + 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroName: { color: colors.white, fontSize: fonts.xl, fontWeight: '800' },
  heroSub: { color: colors.primarySoft, fontSize: fonts.md, marginTop: spacing.xs },
  sectionTitle: { fontSize: fonts.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  label: { fontSize: fonts.sm, fontWeight: '700', color: colors.textMuted, marginTop: spacing.md },
  body: { fontSize: fonts.md, color: colors.text, marginTop: spacing.xs, lineHeight: 21 },
  muted: { fontSize: fonts.sm, color: colors.textMuted },
  inlineButton: { marginTop: spacing.md, alignItems: 'flex-start' },
  hotline: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  hotlineName: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  hotlineNumber: { fontSize: fonts.lg, fontWeight: '800', color: colors.danger, marginVertical: spacing.sm },
  orgCard: {
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  orgCardChild: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  orgName: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  footerNote: { textAlign: 'center', color: colors.textMuted, fontSize: fonts.sm, marginTop: spacing.lg },
});
