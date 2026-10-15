import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../services/authService';
import { COLORS, FONT, SPACING, RADIUS, SHADOW } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const USE_NATIVE_DRIVER = typeof window === 'undefined';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // ============ ANIMATIONS ============
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(30)).current;

  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(40)).current;

  const buttonScale = useRef(new Animated.Value(0.9)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const footerOpacity = useRef(new Animated.Value(0)).current;

  const errorShake = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;

  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0.5)).current;

  // ============ SÉQUENCE D'ANIMATIONS ============
  useEffect(() => {
    // Logo
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.15,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.inOut(Easing.back(1.8)),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    ]).start();

    // Titre
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 500,
        delay: 400,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(titleTranslate, {
        toValue: 0,
        duration: 600,
        delay: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();

    // Form
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 600,
        delay: 700,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(formTranslate, {
        toValue: 0,
        duration: 700,
        delay: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();

    // Bouton
    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        delay: 1000,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        delay: 1000,
        friction: 5,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();

    // Footer
    Animated.timing(footerOpacity, {
      toValue: 1,
      duration: 500,
      delay: 1300,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();

    // Ring pulsant
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1.5,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
      ])
    ).start();

    // Rotation douce du logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start();
  }, []);

  // ============ SHAKE ERROR ============
  const triggerError = (msg) => {
    setError(msg);
    Animated.parallel([
      Animated.timing(errorOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.sequence([
        Animated.timing(errorShake, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]),
    ]).start();

    // Effacer automatiquement après 4s
    setTimeout(() => {
      Animated.timing(errorOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(() => setError(''));
    }, 4000);
  };

  // ============ LOGIN ============
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return triggerError('Remplissez tous les champs');
    }
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      triggerError(result.error);
    }
  };

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-4deg', '4deg'],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* FOND DÉCORÉ */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />
      <FloatingParticle x={50} y={150} delay={0} />
      <FloatingParticle x={width - 70} y={250} delay={800} />
      <FloatingParticle x={80} y={height - 250} delay={1600} />
      <FloatingParticle x={width - 100} y={height - 180} delay={400} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* LOGO */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.ring,
              {
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.logoBox,
              {
                opacity: logoOpacity,
                transform: [
                  { scale: logoScale },
                  { rotate: logoRotation },
                ],
              },
            ]}
          >
            <Ionicons name="calendar" size={52} color="#fff" />
          </Animated.View>
        </View>

        {/* TITRE */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslate }],
            alignItems: 'center',
          }}
        >
          <Text style={styles.title}>Planning Ooredoo</Text>
          <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>
        </Animated.View>

        {/* FORMULAIRE */}
        <Animated.View
          style={[
            styles.form,
            {
              opacity: formOpacity,
              transform: [{ translateY: formTranslate }],
            },
          ]}
        >
          {/* ERROR MESSAGE */}
          {error !== '' && (
            <Animated.View
              style={[
                styles.errorBox,
                {
                  opacity: errorOpacity,
                  transform: [{ translateX: errorShake }],
                },
              ]}
            >
              <Ionicons name="alert-circle" size={18} color="#fff" />
              <Text style={styles.errorTxt}>{error}</Text>
            </Animated.View>
          )}

          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View
              style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailFocused ? COLORS.primary : COLORS.textMuted}
              />
              <TextInput
                style={styles.input}
                placeholder="exemple@ooredoo.dz"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
            </View>
          </View>

          {/* PASSWORD */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mot de passe</Text>
            <View
              style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? COLORS.primary : COLORS.textMuted}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
                autoComplete="password"
                editable={!loading}
                onSubmitEditing={handleLogin}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={10}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textMuted}
                />
              </Pressable>
            </View>
          </View>

          {/* SE CONNECTER */}
          <Animated.View
            style={{
              opacity: buttonOpacity,
              transform: [{ scale: buttonScale }],
              marginTop: SPACING.md,
            }}
          >
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.loginBtnTxt}>Connexion...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={styles.loginBtnTxt}>Se connecter</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* HINT */}
          <Animated.View style={[styles.hintBox, { opacity: footerOpacity }]}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.hintTxt}>
              Utilisez le compte créé dans Firebase Console
            </Text>
          </Animated.View>
        </Animated.View>

        {/* FOOTER */}
        <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
          <Text style={styles.footerTxt}>© 2026 Planning Ooredoo</Text>
          <Text style={styles.footerVersion}>v1.0.0</Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============ PARTICULES FLOTTANTES ============
function FloatingParticle({ x, y, delay }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(translateY, {
            toValue: -60,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: x,
          top: y,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
    minHeight: height - 40,
  },

  // Fond décoré
  bgCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(227,6,19,0.08)',
    top: -180,
    right: -120,
  },
  bgCircle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(227,6,19,0.05)',
    bottom: -120,
    left: -100,
  },
  bgCircle3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(227,6,19,0.04)',
    top: '35%',
    left: -60,
  },
  particle: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(227,6,19,0.35)',
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  ring: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(227,6,19,0.25)',
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.lg,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
  },

  // Titre
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT.md,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Formulaire
  form: {
    width: '100%',
    marginTop: SPACING.xl,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  errorTxt: {
    color: '#fff',
    fontSize: FONT.sm,
    fontWeight: '600',
    flex: 1,
  },

  // Input group
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  input: {
    flex: 1,
    fontSize: FONT.md,
    color: COLORS.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 0 : 10,
    outlineStyle: 'none',
  },

  // Bouton
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 4,
    borderRadius: RADIUS.md,
    ...SHADOW.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT.lg - 1,
    letterSpacing: 0.3,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Hint
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.lg,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  hintTxt: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    gap: 4,
  },
  footerTxt: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerVersion: {
    fontSize: 10,
    color: COLORS.textMuted,
    opacity: 0.7,
  },
});
