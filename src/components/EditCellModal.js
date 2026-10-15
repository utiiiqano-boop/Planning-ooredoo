import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SHIFT_CODES, COLORS, SPACING, RADIUS, FONT, SHADOW } from '../constants/theme';

export default function EditCellModal({ visible, personName, dateLabel, currentShift, onSelect, onClear, onClose }) {
  const options = ['G1', 'G3', 'REPOS', 'CONGE'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{personName}</Text>
              <Text style={styles.subtitle}>{dateLabel}</Text>
            </View>
          </View>

          <Text style={styles.label}>Shift actuel : {currentShift || 'auto'}</Text>

          {options.map(key => {
            const opt = SHIFT_CODES[key];
            const isActive = currentShift === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.option, { backgroundColor: opt.color }, isActive && styles.optionActive]}
                onPress={() => onSelect(key)}
              >
                <Text style={[styles.optionTxt, { color: opt.textColor }]}>{opt.label}</Text>
                {isActive && <Ionicons name="checkmark-circle" size={20} color={opt.textColor} />}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
            <Ionicons name="refresh" size={16} color={COLORS.textPrimary} />
            <Text style={styles.clearTxt}>Rétablir automatique</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelTxt}>Annuler</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  card: { backgroundColor: '#fff', borderRadius: RADIUS.xl, padding: SPACING.xl, width: '100%', maxWidth: 340, ...SHADOW.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  iconBox: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: 1 },
  label: { fontSize: FONT.sm, color: COLORS.textMuted, marginBottom: SPACING.md, fontStyle: 'italic' },
  option: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  optionActive: { borderWidth: 3, borderColor: COLORS.textPrimary },
  optionTxt: { fontWeight: '700', fontSize: FONT.md },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#F7FAFC',
    borderRadius: RADIUS.md,
  },
  clearTxt: { color: COLORS.textPrimary, fontWeight: '700', fontSize: FONT.sm },
  cancelBtn: { padding: SPACING.md, alignItems: 'center', marginTop: SPACING.xs },
  cancelTxt: { color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '600' },
});
