import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>TEST 1: APP NUE</Text>
      <Text style={styles.sub}>Si tu vois ceci → le problème vient d'un composant</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E30613',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
  },
});
