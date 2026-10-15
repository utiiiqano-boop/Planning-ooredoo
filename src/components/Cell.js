import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SHIFT_CODES, RADIUS, FONT } from '../constants/theme';

export default function Cell({ value, size = 40, onPress }) {
  const code = SHIFT_CODES[value] || { color: '#EDF2F7', textColor: '#A0AEC0' };
  const display = value === 'REPOS' ? 'R' : value === 'CONGE' ? 'C' : (value || '–');

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
      style={[
        styles.cell,
        {
          backgroundColor: code.color,
          width: size,
          height: size,
          borderRadius: RADIUS.sm,
        },
      ]}
    >
      <Text style={[styles.txt, { color: code.textColor, fontSize: FONT.sm + 1 }]}>
        {display}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1.5,
    marginVertical: 2,
  },
  txt: { fontWeight: '700', letterSpacing: 0.3 },
});
