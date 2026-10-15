import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../constants/theme';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../services/firestoreService';

export default function SettingsScreen({ onClose }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s);
      setLoading(false);
    })();
  }, []);

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      Alert.alert('✅ Succès', 'Paramètres enregistrés !');
      if (onClose) onClose();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser',
      'Revenir aux valeurs par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Oui', onPress: () => setSettings(DEFAULT_SETTINGS) },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paramètres</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* NOM DE L'ÉQUIPE */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="business" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Nom de l'équipe</Text>
          </View>
          <TextInput
            style={styles.input}
            value={settings.teamName}
            onChangeText={v => update('teamName', v)}
            placeholder="Ex: Ooredoo Call Center"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* SHIFT 1 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.shiftDot, { backgroundColor: COLORS.g1 }]} />
            <Text style={styles.cardTitle}>Shift 1 (G1)</Text>
          </View>

          <Text style={styles.label}>Nom du shift</Text>
          <TextInput
            style={styles.input}
            value={settings.shift1Label}
            onChangeText={v => update('shift1Label', v)}
            placeholder="Ex: Matin"
            placeholderTextColor={COLORS.textMuted}
          />

          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Début</Text>
              <TextInput
                style={styles.input}
                value={settings.shift1Start}
                onChangeText={v => update('shift1Start', v)}
                placeholder="09:00"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Fin</Text>
              <TextInput
                style={styles.input}
                value={settings.shift1End}
                onChangeText={v => update('shift1End', v)}
                placeholder="15:00"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>
        </View>

        {/* SHIFT 2 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.shiftDot, { backgroundColor: COLORS.g3 }]} />
            <Text style={styles.cardTitle}>Shift 2 (G3)</Text>
          </View>

          <Text style={styles.label}>Nom du shift</Text>
          <TextInput
            style={styles.input}
            value={settings.shift2Label}
            onChangeText={v => update('shift2Label', v)}
            placeholder="Ex: Nuit"
            placeholderTextColor={COLORS.textMuted}
          />

          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Début</Text>
              <TextInput
                style={styles.input}
                value={settings.shift2Start}
                onChangeText={v => update('shift2Start', v)}
                placeholder="15:00"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Fin</Text>
              <TextInput
                style={styles.input}
                value={settings.shift2End}
                onChangeText={v => update('shift2End', v)}
                placeholder="09:00"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>
        </View>

        {/* APERÇU */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>📋 Aperçu</Text>
          <View style={styles.previewRow}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.g1 }]} />
            <Text style={styles.previewTxt}>
              {settings.shift1Label} · {settings.shift1Start} - {settings.shift1End}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.g3 }]} />
            <Text style={styles.previewTxt}>
              {settings.shift2Label} · {settings.shift2Start} - {settings.shift2End}
            </Text>
          </View>
        </View>

        {/* BOUTONS */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnTxt}>Enregistrer</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Ionicons name="refresh" size={16} color={COLORS.textSecondary} />
          <Text style={styles.resetBtnTxt}>Réinitialiser aux valeurs par défaut</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: SPACING.md, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  headerTitle: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.textPrimary },

  card: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  cardTitle: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.textPrimary },
  shiftDot: { width: 14, height: 14, borderRadius: 4 },
  label: {
    fontSize: FONT.sm, fontWeight: '600', color: COLORS.textSecondary,
    marginBottom: SPACING.xs, marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: '#F7FAFC',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT.md,
    color: COLORS.textPrimary,
    borderWidth: 1.5, borderColor: COLORS.border,
  },

  previewCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  previewTitle: { fontSize: FONT.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  previewTxt: { fontSize: FONT.sm, color: COLORS.textPrimary, fontWeight: '600' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.md,
    ...SHADOW.md,
  },
  saveBtnTxt: { color: '#fff', fontWeight: '700', fontSize: FONT.md },

  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  resetBtnTxt: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '600' },
});
