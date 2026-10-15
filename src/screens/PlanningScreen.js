import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Cell from '../components/Cell';
import EditCellModal from '../components/EditCellModal';
import SettingsScreen from './SettingsScreen';
import HistoryScreen from './HistoryScreen';
import { SHIFT_CODES, DAYS_SHORT, COLORS, SPACING, RADIUS, FONT, SHADOW, DAYS_FR_SHORT, DAYS_FR } from '../constants/theme';
import { generatePlanning, getStats } from '../utils/planningGenerator';
import { addDays, formatDate, formatDateFR, getWeekNumber, getNextMonday } from '../utils/dateHelpers';
import { exportPlanningToExcel } from '../utils/excelExporter';
import { exportPlanningToPDF } from '../utils/pdfExporter';
import {
  subscribePersons,
  addPerson as addPersonDB,
  deletePerson as deletePersonDB,
  updatePerson,
  subscribeConges,
  addConge as addCongeDB,
  deleteConge as deleteCongeDB,
  subscribeOverrides,
  setOverride,
  clearOverride,
  subscribeSettings,
  savePlanning,
  DEFAULT_SETTINGS,
} from '../services/firestoreService';
import { logout } from '../services/authService';

export default function PlanningScreen() {
  const [persons, setPersons] = useState([]);
  const [conges, setConges] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(null);

  const [newName, setNewName] = useState('');
  const [newIsResp, setNewIsResp] = useState(false);

  const [congeName, setCongeName] = useState('');
  const [congeStart, setCongeStart] = useState('');
  const [congeEnd, setCongeEnd] = useState('');

  const [weeks, setWeeks] = useState(2);
  const [planning, setPlanning] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const startDate = useMemo(() => getNextMonday(), []);

  const [editModal, setEditModal] = useState({ visible: false, personName: '', dateKey: '', currentShift: '' });
  const [restModal, setRestModal] = useState({ visible: false, person: null });
  const [showTeam, setShowTeam] = useState(false);
  const [showConges, setShowConges] = useState(false);

  const [screen, setScreen] = useState('main'); // 'main' | 'settings' | 'history'

  const autoFixDone = useRef(false);

  // SYNC
  useEffect(() => {
    let mounted = true;
    const unsubP = subscribePersons(
      list => {
        if (!mounted) return;
        const sorted = list.filter(p => p.name).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setPersons(sorted);
        setLoading(false);
        setFirestoreError(null);
      },
      err => { if (mounted) { setFirestoreError(err.message); setLoading(false); } }
    );
    const unsubC = subscribeConges(list => { if (mounted) setConges(list); });
    const unsubO = subscribeOverrides(map => { if (mounted) setOverrides(map); });
    const unsubS = subscribeSettings(s => { if (mounted) setSettings(s); });
    return () => { mounted = false; unsubP(); unsubC(); unsubO(); unsubS(); };
  }, []);

  // AUTO-FIX
  useEffect(() => {
    if (loading || autoFixDone.current || persons.length === 0) return;
    const missing = persons.filter(p => p.restDay === null || p.restDay === undefined);
    if (missing.length === 0) { autoFixDone.current = true; return; }
    autoFixDone.current = true;
    const used = new Set(persons.map(p => p.restDay).filter(d => d !== null && d !== undefined));
    (async () => {
      for (const p of missing) {
        let next = 0;
        for (let i = 0; i < 7; i++) if (!used.has(i)) { next = i; used.add(i); break; }
        try { await updatePerson(p.id, { restDay: next }); } catch (e) {}
      }
    })();
  }, [persons, loading]);

  // ACTIONS
  const addPerson = async () => {
    const name = newName.trim();
    if (!name) return Alert.alert('Erreur', 'Entrez un nom.');
    if (persons.some(p => p.name.toLowerCase() === name.toLowerCase())) return Alert.alert('Erreur', 'Existe déjà.');
    try {
      const used = new Set(persons.map(p => p.restDay).filter(d => d !== null && d !== undefined));
      let nextRest = 0;
      for (let i = 0; i < 7; i++) if (!used.has(i)) { nextRest = i; break; }
      await addPersonDB({ name, isResponsable: newIsResp, restDay: nextRest });
      setNewName(''); setNewIsResp(false);
    } catch (e) { Alert.alert('Erreur', e.message); }
  };

  const removePerson = (person) => {
    Alert.alert('Supprimer', `Supprimer ${person.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive',
        onPress: async () => { try { await deletePersonDB(person.id); } catch (e) { Alert.alert('Erreur', e.message); } } },
    ]);
  };

  const toggleResponsable = async (person) => {
    try { await updatePerson(person.id, { isResponsable: !person.isResponsable }); }
    catch (e) { Alert.alert('Erreur', e.message); }
  };

  const changeRestDay = async (person, dayIndex) => {
    try { await updatePerson(person.id, { restDay: dayIndex }); setRestModal({ visible: false, person: null }); }
    catch (e) { Alert.alert('Erreur', e.message); }
  };

  const fixRestDays = async () => {
    Alert.alert('🔧 Réattribuer les repos', 'Chaque personne aura un jour différent (Lun→Dim). Continuer ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Oui', onPress: async () => {
        try {
          for (let i = 0; i < persons.length; i++) await updatePerson(persons[i].id, { restDay: i % 7 });
          autoFixDone.current = true;
          Alert.alert('✅ Succès', 'Jours de repos réattribués !');
        } catch (e) { Alert.alert('Erreur', e.message); }
      } },
    ]);
  };

  const addConge = async () => {
    if (!congeName) return Alert.alert('Erreur', 'Choisissez une personne.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(congeStart) || !/^\d{4}-\d{2}-\d{2}$/.test(congeEnd))
      return Alert.alert('Erreur', 'Format: YYYY-MM-DD');
    if (congeStart > congeEnd) return Alert.alert('Erreur', 'Date début > fin.');
    try {
      await addCongeDB({ personName: congeName, startDate: congeStart, endDate: congeEnd });
      setCongeName(''); setCongeStart(''); setCongeEnd('');
    } catch (e) { Alert.alert('Erreur', e.message); }
  };

  const removeConge = async (conge) => {
    try { await deleteCongeDB(conge.id); } catch (e) { Alert.alert('Erreur', e.message); }
  };

  const handleGenerate = () => {
    if (persons.length < 2) return Alert.alert('Attention', `Il faut au moins 2 personnes (${persons.length}/2).`);
    const missing = persons.filter(p => p.restDay === null || p.restDay === undefined);
    if (missing.length > 0) return Alert.alert('Attention', `${missing.length} personne(s) sans repos défini. Cliquez sur "🔧 Fix".`);
    try {
      const p = generatePlanning(persons, conges, weeks, startDate, overrides);
      setPlanning(p);
    } catch (e) { Alert.alert('Erreur', e.message); }
  };

  useEffect(() => {
    if (planning && persons.length >= 2) {
      const p = generatePlanning(persons, conges, weeks, startDate, overrides);
      setPlanning(p);
    }
  }, [overrides, persons, conges]);

  const openEditModal = (personName, dateKey) => {
    const current = planning?.[personName]?.[dateKey] || '';
    setEditModal({ visible: true, personName, dateKey, currentShift: overrides[dateKey]?.[personName] || current });
  };

  const handleSelectShift = async (shift) => {
    try { await setOverride(editModal.dateKey, editModal.personName, shift); setEditModal({ ...editModal, visible: false }); }
    catch (e) { Alert.alert('Erreur', e.message); }
  };

  const handleClearOverride = async () => {
    try { await clearOverride(editModal.dateKey, editModal.personName); setEditModal({ ...editModal, visible: false }); }
    catch (e) { Alert.alert('Erreur', e.message); }
  };

  // EXPORT EXCEL
  const handleExportExcel = async () => {
    if (!planning) return Alert.alert('Info', 'Générez d\'abord le planning.');
    setExporting(true);
    const weeksData = [];
    for (let w = 0; w < weeks; w++) {
      weeksData.push({ days: Array.from({ length: 7 }, (_, i) => addDays(startDate, w * 7 + i)) });
    }
    const result = await exportPlanningToExcel({ planning, persons, weeksData, conges });
    setExporting(false);
    if (result.success && Platform.OS === 'web') Alert.alert('✅ Succès', 'Fichier Excel téléchargé !');
    else if (!result.success) Alert.alert('Erreur export', result.error);
  };

  // EXPORT PDF
  const handleExportPDF = async () => {
    if (!planning) return Alert.alert('Info', 'Générez d\'abord le planning.');
    const weeksData = [];
    for (let w = 0; w < weeks; w++) {
      weeksData.push({ days: Array.from({ length: 7 }, (_, i) => addDays(startDate, w * 7 + i)) });
    }
    const result = await exportPlanningToPDF({
      planning, persons, weeksData, conges,
      settings, teamName: settings.teamName,
    });
    if (!result.success) Alert.alert('Erreur PDF', result.error);
  };

  // SAUVEGARDER
  const handleSave = async () => {
    if (!planning) return Alert.alert('Info', 'Générez d\'abord le planning.');
    Alert.prompt
      ? Alert.prompt('Nom du planning', 'Donnez un nom à ce planning', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Enregistrer', onPress: async (name) => {
            setSaving(true);
            try {
              await savePlanning({ name, planning, persons, conges, weeks, startDate });
              Alert.alert('✅ Succès', 'Planning sauvegardé dans l\'historique !');
            } catch (e) { Alert.alert('Erreur', e.message); }
            finally { setSaving(false); }
          } },
        ], 'plain-text', `Planning du ${new Date().toLocaleDateString('fr-FR')}`)
      : (async () => {
          setSaving(true);
          try {
            await savePlanning({ planning, persons, conges, weeks, startDate });
            Alert.alert('✅ Succès', 'Planning sauvegardé !');
          } catch (e) { Alert.alert('Erreur', e.message); }
          finally { setSaving(false); }
        })();
  };

  // CHARGER UN PLANNING DE L'HISTORIQUE
  const handleLoadFromHistory = (item) => {
    setWeeks(item.weeks);
    setPlanning(item.planning);
    setScreen('main');
    Alert.alert('✅ Chargé', `"${item.name}" restauré.`);
  };

  const weeksData = useMemo(() => {
    const out = [];
    for (let w = 0; w < weeks; w++) {
      out.push({
        weekIndex: w,
        start: addDays(startDate, w * 7),
        days: Array.from({ length: 7 }, (_, i) => addDays(startDate, w * 7 + i)),
      });
    }
    return out;
  }, [weeks, startDate]);

  // ÉCRANS SECONDAIRES
  if (screen === 'settings') {
    return <SettingsScreen onClose={() => setScreen('main')} />;
  }
  if (screen === 'history') {
    return <HistoryScreen onClose={() => setScreen('main')} onLoad={handleLoadFromHistory} />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingTxt}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <Ionicons name="calendar" size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>{settings.teamName || 'Ooredoo'}</Text>
              <Text style={styles.headerSub}>Gestion des shifts</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setScreen('history')} style={styles.headerIconBtn}>
              <Ionicons name="time-outline" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setScreen('settings')} style={styles.headerIconBtn}>
              <Ionicons name="settings-outline" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.headerIconBtn}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{persons.length}</Text>
            <Text style={styles.statLabel}>Personnes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.info} />
            <Text style={styles.statValue}>{weeks}</Text>
            <Text style={styles.statLabel}>Semaine{weeks > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="airplane" size={20} color={COLORS.warning} />
            <Text style={styles.statValue}>{conges.length}</Text>
            <Text style={styles.statLabel}>Congés</Text>
          </View>
        </View>

        {firestoreError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
            <Text style={styles.errorTxt}>{firestoreError}</Text>
          </View>
        )}

        {/* GÉNÉRATION */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flash" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Générer le planning</Text>
          </View>

          <Text style={styles.inputLabel}>Nombre de semaines</Text>
          <View style={styles.weeksRow}>
            {[1, 2, 3, 4].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.weekBtn, weeks === n && styles.weekBtnActive]}
                onPress={() => setWeeks(n)}
              >
                <Text style={[styles.weekBtnTxt, weeks === n && styles.weekBtnTxtActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, persons.length < 2 && styles.primaryBtnDisabled]}
            onPress={handleGenerate}
            activeOpacity={0.8}
          >
            <Ionicons name="rocket" size={18} color="#fff" />
            <Text style={styles.primaryBtnTxt}>
              {persons.length < 2 ? `Ajouter ${2 - persons.length} personne(s)` : 'Générer'}
            </Text>
          </TouchableOpacity>

          {planning && (
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                onPress={handleExportExcel}
                disabled={exporting}
              >
                <Ionicons name="download-outline" size={16} color={COLORS.success} />
                <Text style={[styles.actionBtnTxt, { color: COLORS.success }]}>Excel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                onPress={handleExportPDF}
              >
                <Ionicons name="document-text-outline" size={16} color={COLORS.danger} />
                <Text style={[styles.actionBtnTxt, { color: COLORS.danger }]}>PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Ionicons name="save-outline" size={16} color={COLORS.info} />
                <Text style={[styles.actionBtnTxt, { color: COLORS.info }]}>
                  {saving ? '...' : 'Sauver'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ÉQUIPE */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardHeader} onPress={() => setShowTeam(!showTeam)} activeOpacity={0.7}>
            <Ionicons name="people" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Équipe ({persons.length})</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={fixRestDays} style={styles.fixBtn}>
              <Ionicons name="construct-outline" size={14} color="#fff" />
              <Text style={styles.fixBtnTxt}>Fix</Text>
            </TouchableOpacity>
            <Ionicons name={showTeam ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          {showTeam && (
            <View style={{ marginTop: SPACING.md }}>
              <View style={styles.addPersonRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Nom de la personne..."
                  placeholderTextColor={COLORS.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                  onSubmitEditing={addPerson}
                />
                <TouchableOpacity style={styles.addIconBtn} onPress={addPerson}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.respToggle} onPress={() => setNewIsResp(!newIsResp)} activeOpacity={0.7}>
                <Ionicons name={newIsResp ? 'checkbox' : 'square-outline'} size={20} color={newIsResp ? COLORS.primary : COLORS.textMuted} />
                <Text style={styles.respToggleTxt}>Responsable (toujours G1)</Text>
              </TouchableOpacity>

              {persons.length === 0 && <Text style={styles.emptyTxt}>Aucune personne.</Text>}

              {persons.map(p => (
                <View key={p.id} style={styles.personItem}>
                  <View style={[styles.personAvatar, p.isResponsable && { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.personAvatarTxt}>{p.isResponsable ? '⭐' : p.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personItemName}>{p.name}</Text>
                    <TouchableOpacity style={styles.restChip} onPress={() => setRestModal({ visible: true, person: p })}>
                      <Ionicons name="bed-outline" size={11} color={COLORS.textSecondary} />
                      <Text style={styles.restChipTxt}>
                        Repos : {p.restDay !== null && p.restDay !== undefined ? DAYS_FR_SHORT[p.restDay] : '⚠️'}
                      </Text>
                      <Ionicons name="chevron-down" size={11} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => removePerson(p)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* CONGÉS */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardHeader} onPress={() => setShowConges(!showConges)} activeOpacity={0.7}>
            <Ionicons name="airplane" size={18} color={COLORS.conge} />
            <Text style={styles.cardTitle}>Congés ({conges.length})</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name={showConges ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {showConges && (
            <View style={{ marginTop: SPACING.md }}>
              <Text style={styles.inputLabel}>Sélectionner une personne</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
                {persons.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.chip, congeName === p.name && styles.chipActive]}
                    onPress={() => setCongeName(p.name)}
                  >
                    <Text style={[styles.chipTxt, congeName === p.name && styles.chipTxtActive]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Début (2026-10-15)" placeholderTextColor={COLORS.textMuted} value={congeStart} onChangeText={setCongeStart} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Fin (2026-10-18)" placeholderTextColor={COLORS.textMuted} value={congeEnd} onChangeText={setCongeEnd} />
              </View>

              <TouchableOpacity style={styles.congeAddBtn} onPress={addConge}>
                <Ionicons name="add-circle-outline" size={16} color={COLORS.conge} />
                <Text style={styles.congeAddTxt}>Ajouter le congé</Text>
              </TouchableOpacity>

              {conges.map(c => (
                <View key={c.id} style={styles.congeItem}>
                  <Ionicons name="airplane-outline" size={14} color={COLORS.conge} />
                  <Text style={styles.congeItemTxt}>{c.personName}</Text>
                  <Text style={styles.congeItemDates}>{c.startDate} → {c.endDate}</Text>
                  <TouchableOpacity onPress={() => removeConge(c)}>
                    <Ionicons name="close-circle" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* LÉGENDE */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.g1 }]} />
            <Text style={styles.legendTxt}>{settings.shift1Label} · {settings.shift1Start}-{settings.shift1End}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.g3 }]} />
            <Text style={styles.legendTxt}>{settings.shift2Label} · {settings.shift2Start}-{settings.shift2End}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.repos }]} />
            <Text style={styles.legendTxt}>REPOS</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.conge }]} />
            <Text style={styles.legendTxt}>CONGE</Text>
          </View>
        </View>

        {/* PLANNING */}
        {planning && weeksData.map(w => (
          <View key={w.weekIndex} style={styles.weekCard}>
            <View style={styles.weekHeader}>
              <View>
                <Text style={styles.weekNumber}>Semaine {getWeekNumber(w.days[0])}</Text>
                <Text style={styles.weekDates}>{formatDateFR(w.days[0])} → {formatDateFR(w.days[6])}</Text>
              </View>
              <View style={styles.weekBadge}>
                <Ionicons name="calendar" size={12} color={COLORS.primary} />
                <Text style={styles.weekBadgeTxt}>{w.days.length}j</Text>
              </View>
            </View>

            <View style={styles.headRow}>
              <View style={{ width: 80 }} />
              {w.days.map((d, i) => {
                const isWeekend = [5, 6].includes((d.getDay() + 6) % 7);
                return (
                  <View key={i} style={styles.headCell}>
                    <Text style={[styles.headDay, isWeekend && { color: COLORS.primary }]}>{DAYS_SHORT[i]}</Text>
                    <Text style={[styles.headNum, isWeekend && { color: COLORS.primary }]}>{d.getDate()}</Text>
                  </View>
                );
              })}
            </View>

            {persons.map(p => {
              const stats = getStats(planning, p.name);
              return (
                <View key={p.id} style={styles.lineRow}>
                  <View style={{ width: 80 }}>
                    <Text style={styles.lineName} numberOfLines={1}>{p.isResponsable ? '⭐ ' : ''}{p.name}</Text>
                    <Text style={styles.lineStats}>G1:{stats.G1} G3:{stats.G3}</Text>
                  </View>
                  {w.days.map(d => {
                    const k = formatDate(d);
                    return <Cell key={k} value={planning[p.name][k]} onPress={() => openEditModal(p.name, k)} />;
                  })}
                </View>
              );
            })}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      <EditCellModal
        visible={editModal.visible}
        personName={editModal.personName}
        dateLabel={editModal.dateKey}
        currentShift={editModal.currentShift}
        onSelect={handleSelectShift}
        onClear={handleClearOverride}
        onClose={() => setEditModal({ ...editModal, visible: false })}
      />

      <Modal visible={restModal.visible} transparent animationType="fade" onRequestClose={() => setRestModal({ visible: false, person: null })}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Repos de {restModal.person?.name}</Text>
            <Text style={styles.modalSub}>Ce jour sera FIXE chaque semaine</Text>
            {DAYS_FR.map((day, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.dayOption, restModal.person?.restDay === idx && styles.dayOptionActive]}
                onPress={() => changeRestDay(restModal.person, idx)}
              >
                <Text style={[styles.dayOptionTxt, restModal.person?.restDay === idx && styles.dayOptionTxtActive]}>{day}</Text>
                {restModal.person?.restDay === idx && <Ionicons name="checkmark-circle" size={18} color="#fff" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setRestModal({ visible: false, person: null })}>
              <Text style={styles.cancelTxt}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: SPACING.md, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTxt: { marginTop: SPACING.md, color: COLORS.textSecondary, fontSize: FONT.md },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  headerRight: { flexDirection: 'row', gap: 6 },
  logoBox: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOW.md },
  headerTitle: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: 1 },
  headerIconBtn: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', ...SHADOW.sm },
  statValue: { fontSize: FONT.xxl, fontWeight: '800', color: COLORS.textPrimary, marginTop: 4 },
  statLabel: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  card: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  cardTitle: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.textPrimary },
  inputLabel: { fontSize: FONT.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs, marginTop: SPACING.sm },

  weeksRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  weekBtn: { flex: 1, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, backgroundColor: '#F7FAFC', borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  weekBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary, ...SHADOW.sm },
  weekBtnTxt: { fontSize: FONT.md, fontWeight: '700', color: COLORS.textPrimary },
  weekBtnTxtActive: { color: '#fff' },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, paddingVertical: SPACING.md + 2, borderRadius: RADIUS.md, ...SHADOW.md },
  primaryBtnDisabled: { backgroundColor: COLORS.textMuted, shadowOpacity: 0 },
  primaryBtnTxt: { color: '#fff', fontWeight: '700', fontSize: FONT.md },

  actionGrid: { flexDirection: 'row', gap: 8, marginTop: SPACING.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1.5 },
  actionBtnTxt: { fontWeight: '700', fontSize: FONT.sm },

  addPersonRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  input: { flex: 1, backgroundColor: '#F7FAFC', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, fontSize: FONT.md, color: COLORS.textPrimary, borderWidth: 1.5, borderColor: COLORS.border },
  addIconBtn: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOW.sm },
  respToggle: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs },
  respToggleTxt: { fontSize: FONT.sm, color: COLORS.textSecondary },
  emptyTxt: { fontSize: FONT.sm, color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: SPACING.md },
  personItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  personAvatar: { width: 38, height: 38, borderRadius: RADIUS.full, backgroundColor: COLORS.textSecondary, justifyContent: 'center', alignItems: 'center' },
  personAvatarTxt: { color: '#fff', fontWeight: '800', fontSize: FONT.md },
  personItemName: { fontSize: FONT.md, fontWeight: '700', color: COLORS.textPrimary },
  restChip: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, backgroundColor: '#F7FAFC', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.border },
  restChipTxt: { fontSize: FONT.xs, color: COLORS.textSecondary, fontWeight: '600' },
  iconBtn: { padding: SPACING.xs },
  fixBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.warning, paddingHorizontal: SPACING.sm, paddingVertical: 5, borderRadius: RADIUS.sm },
  fixBtnTxt: { color: '#fff', fontWeight: '700', fontSize: FONT.xs },

  chip: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: '#F7FAFC', marginRight: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.conge, borderColor: COLORS.conge },
  chipTxt: { fontSize: FONT.sm, color: COLORS.textPrimary, fontWeight: '600' },
  chipTxtActive: { color: '#fff' },
  congeAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.congeBg, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, marginTop: SPACING.md, borderWidth: 1.5, borderColor: '#FECACA' },
  congeAddTxt: { color: COLORS.conge, fontWeight: '700', fontSize: FONT.sm },
  congeItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  congeItemTxt: { fontSize: FONT.sm, fontWeight: '700', color: COLORS.textPrimary },
  congeItemDates: { fontSize: FONT.xs, color: COLORS.textSecondary, flex: 1 },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: '#FEF2F2', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderLeftWidth: 4, borderLeftColor: COLORS.danger },
  errorTxt: { fontSize: FONT.sm, color: COLORS.danger, flex: 1 },

  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.md, paddingVertical: SPACING.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendTxt: { fontSize: FONT.xs, color: COLORS.textSecondary, fontWeight: '600' },

  weekCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, paddingBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  weekNumber: { fontSize: FONT.lg, fontWeight: '800', color: COLORS.textPrimary },
  weekDates: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 1 },
  weekBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF2F2', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  weekBadgeTxt: { fontSize: FONT.xs, color: COLORS.primary, fontWeight: '700' },

  headRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  headCell: { width: 44, alignItems: 'center' },
  headDay: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700' },
  headNum: { fontSize: FONT.sm, fontWeight: '800', color: COLORS.textPrimary },

  lineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  lineName: { fontSize: FONT.sm, fontWeight: '700', color: COLORS.textPrimary },
  lineStats: { fontSize: 9, color: COLORS.textMuted, marginTop: 1 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  modalCard: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.xl, width: '100%', maxWidth: 340, ...SHADOW.lg },
  modalTitle: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.textPrimary },
  modalSub: { fontSize: FONT.sm, color: COLORS.textSecondary, marginBottom: SPACING.md, fontStyle: 'italic' },
  dayOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: '#F7FAFC', marginBottom: 6 },
  dayOptionActive: { backgroundColor: COLORS.primary },
  dayOptionTxt: { color: COLORS.textPrimary, fontWeight: '700', fontSize: FONT.md },
  dayOptionTxtActive: { color: '#fff' },
  cancelBtn: { padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  cancelTxt: { color: COLORS.textSecondary, fontSize: FONT.md, fontWeight: '600' },
});
