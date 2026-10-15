import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT, SHADOW } from '../constants/theme';
import { subscribePlannings, deletePlanning } from '../services/firestoreService';

export default function HistoryScreen({ onClose, onLoad }) {
  const [plannings, setPlannings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmLoad, setConfirmLoad] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = subscribePlannings(
      list => { setPlannings(list); setLoading(false); },
      err => { console.error('[HISTORY]', err); setLoading(false); }
    );
    return unsub;
  }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await deletePlanning(confirmDelete.id);
      setConfirmDelete(null);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLoad = () => {
    if (!confirmLoad) return;
    onLoad(confirmLoad);
    setConfirmLoad(null);
  };

  const formatDate = (ts) => {
    if (!ts?.seconds) return '';
    const d = new Date(ts.seconds * 1000);
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {!loading && plannings.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Aucun planning sauvegardé</Text>
            <Text style={styles.emptyTxt}>
              Générez un planning et cliquez sur "💾 Sauver" pour le voir ici.
            </Text>
          </View>
        )}

        {plannings.map(item => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemIconBox}>
                <Ionicons name="document-text" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.itemMeta}>
              <View style={styles.metaChip}>
                <Ionicons name="people-outline" size={11} color={COLORS.textSecondary} />
                <Text style={styles.metaChipTxt}>{item.personsSnapshot?.length || 0} pers.</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="calendar-outline" size={11} color={COLORS.textSecondary} />
                <Text style={styles.metaChipTxt}>{item.weeks} sem.</Text>
              </View>
              {item.congesSnapshot?.length > 0 && (
                <View style={styles.metaChip}>
                  <Ionicons name="airplane-outline" size={11} color={COLORS.conge} />
                  <Text style={[styles.metaChipTxt, { color: COLORS.conge }]}>
                    {item.congesSnapshot.length} congés
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.loadBtn}
                onPress={() => setConfirmLoad(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="download-outline" size={14} color="#fff" />
                <Text style={styles.loadBtnTxt}>Charger</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setConfirmDelete(item)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* MODAL CONFIRMATION CHARGER */}
      <Modal
        visible={!!confirmLoad}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmLoad(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="download" size={28} color={COLORS.info} />
            </View>
            <Text style={styles.modalTitle}>Charger ce planning ?</Text>
            <Text style={styles.modalSub}>{confirmLoad?.name}</Text>
            <Text style={styles.modalInfo}>
              Le planning actuel sera remplacé.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setConfirmLoad(null)}
              >
                <Text style={styles.modalCancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn, { backgroundColor: COLORS.info }]}
                onPress={handleLoad}
              >
                <Text style={styles.modalConfirmTxt}>Charger</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CONFIRMATION SUPPRIMER */}
      <Modal
        visible={!!confirmDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDelete(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconBox, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="trash" size={28} color={COLORS.danger} />
            </View>
            <Text style={styles.modalTitle}>Supprimer ?</Text>
            <Text style={styles.modalSub}>{confirmDelete?.name}</Text>
            <Text style={styles.modalInfo}>
              Cette action est irréversible.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setConfirmDelete(null)}
                disabled={busy}
              >
                <Text style={styles.modalCancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirmBtn, { backgroundColor: COLORS.danger }]}
                onPress={handleDelete}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmTxt}>Supprimer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: SPACING.md, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },

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

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOW.sm,
  },
  emptyTitle: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.md },
  emptyTxt: { fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },

  itemCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  itemIconBox: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center', alignItems: 'center',
  },
  itemTitle: { fontSize: FONT.md, fontWeight: '700', color: COLORS.textPrimary },
  itemDate: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 1 },
  itemMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: SPACING.sm },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
  },
  metaChipTxt: { fontSize: FONT.xs, color: COLORS.textSecondary, fontWeight: '600' },
  itemActions: { flexDirection: 'row', gap: SPACING.sm },
  loadBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  loadBtnTxt: { color: '#fff', fontWeight: '700', fontSize: FONT.sm },
  deleteBtn: {
    width: 44,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.md,
  },

  // MODAL
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%', maxWidth: 340,
    alignItems: 'center',
    ...SHADOW.lg,
  },
  modalIconBox: {
    width: 60, height: 60, borderRadius: RADIUS.full,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  modalSub: {
    fontSize: FONT.sm, color: COLORS.textSecondary,
    textAlign: 'center', marginTop: 4,
    fontStyle: 'italic',
  },
  modalInfo: {
    fontSize: FONT.xs, color: COLORS.textMuted,
    textAlign: 'center', marginTop: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row', gap: SPACING.sm,
    marginTop: SPACING.lg,
    width: '100%',
  },
  modalBtn: {
    flex: 1, paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1, borderColor: COLORS.border,
  },
  modalCancelTxt: { color: COLORS.textSecondary, fontWeight: '700', fontSize: FONT.md },
  modalConfirmBtn: {
    backgroundColor: COLORS.primary,
  },
  modalConfirmTxt: { color: '#fff', fontWeight: '700', fontSize: FONT.md },
});
