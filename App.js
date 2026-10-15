import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { subscribeAuth } from './src/services/authService';
import LoginScreen from './src/screens/LoginScreen';
import PlanningScreen from './src/screens/PlanningScreen';

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = subscribeAuth(u => setUser(u || null));
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#e30613" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {user ? <PlanningScreen user={user} /> : <LoginScreen />}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
});
