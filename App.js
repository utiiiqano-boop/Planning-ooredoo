import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { subscribeAuth } from './src/services/authService';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import PlanningScreen from './src/screens/PlanningScreen';
import { COLORS } from './src/constants/theme';

export default function App() {
  const [user, setUser] = useState(undefined);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const unsub = subscribeAuth(u => setUser(u || null));
    return unsub;
  }, []);

  // 1. Splash screen en premier
  if (!splashDone) {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={() => setSplashDone(true)} />
      </SafeAreaProvider>
    );
  }

  // 2. Chargement de Firebase Auth
  if (user === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // 3. Login ou Planning selon l'état d'auth
  return (
    <SafeAreaProvider>
      {user ? <PlanningScreen /> : <LoginScreen />}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
});
