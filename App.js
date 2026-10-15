import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, LogBox, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { subscribeAuth } from './src/services/authService';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import PlanningScreen from './src/screens/PlanningScreen';
import { COLORS } from './src/constants/theme';

if (Platform.OS === 'web') {
  LogBox.ignoreLogs([
    'Animated: `useNativeDriver` is not supported',
    'useNativeDriver',
  ]);
}

export default function App() {
  const [user, setUser] = useState(undefined);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const unsub = subscribeAuth(u => setUser(u || null));
    return unsub;
  }, []);

  if (!splashDone) {
    return (
      <SafeAreaProvider>
        <SplashScreen onFinish={() => setSplashDone(true)} />
      </SafeAreaProvider>
    );
  }

  if (user === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
