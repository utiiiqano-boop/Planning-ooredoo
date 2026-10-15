import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS, SHADOW } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const USE_NATIVE_DRIVER = typeof window === 'undefined';

export default function SplashScreen({ onFinish }) {
  // ============ ANIMATIONS ============
  const logoScale = useRef(new Animated.Value(0.2)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(30)).current;

  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslate = useRef(new Animated.Value(20)).current;

  const dividerWidth = useRef(new Animated.Value(0)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;

  const footerOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;

  const fullScreenScale = useRef(new Animated.Value(1)).current;
  const fullScreenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // ============ SÉQUENCE PRINCIPALE ============
    Animated.sequence([
      // 1. LOGO : Zoom in puissant avec rebond (0.2 → 1.3 → 1.0)
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.3,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.back(2)),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
      ]),

      // 2. TITRE : Slide up + fade
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),

      // 3. SOUS-TITRE + LIGNE + FOOTER en parallèle
      Animated.parallel([
        Animated.parallel([
          Animated.timing(subtitleOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(subtitleTranslate, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
        Animated.sequence([
          Animated.delay(300),
          Animated.parallel([
            Animated.timing(dividerOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(dividerWidth, {
              toValue: 200,
              duration: 600,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(footerOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
      ]),

      // 4. BARRE DE PROGRESSION (dure jusqu'à la fin)
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();

    // ============ RING PULSANT EN BOUCLE ============
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, {
            toValue: 1.6,
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
            toValue: 0.6,
            duration: 0,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
      ])
    ).start();

    // ============ ROTATION LÉGÈRE DU LOGO ============
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

    // ============ SORTIE ZOOM OUT (à 4.5s) ============
    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fullScreenScale, {
          toValue: 1.4,
          duration: 500,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(fullScreenOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
    }, 4500);

    // ============ FIN APRÈS 5s ============
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 5000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  const logoRotation = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const progressPercent = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Cercles décoratifs en arrière-plan */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Particules flottantes */}
      <FloatingParticle x={40} y={120} delay={0} />
      <FloatingParticle x={width - 60} y={200} delay={800} />
      <FloatingParticle x={60} y={height - 200} delay={1600} />
      <FloatingParticle x={width - 80} y={height - 150} delay={400} />

      {/* CONTENU PRINCIPAL */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: fullScreenScale }],
            opacity: fullScreenOpacity,
          },
        ]}
      >
        {/* Ring pulsant */}
        <Animated.View
          style={[
            styles.ring,
            {
              transform: [{ scale: ringScale }],
              opacity: ringOpacity,
            },
          ]}
        />

        {/* LOGO avec rotation douce */}
        <Animated.View
          style={[
            styles.logoBox,
            {
              transform: [
                { scale: logoScale },
                { rotate: logoRotation },
              ],
              opacity: logoOpacity,
            },
          ]}
        >
          <Ionicons name="calendar" size={56} color="#fff" />
        </Animated.View>

        {/* TITRE */}
        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslate }],
            },
          ]}
        >
          Planning Ooredoo
        </Animated.Text>

        {/* SOUS-TITRE */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslate }],
            },
          ]}
        >
          Gestion des shifts simplifiée
        </Animated.Text>

        {/* LIGNE DE SÉPARATION */}
        <Animated.View
          style={[
            styles.divider,
            {
              width: dividerWidth,
              opacity: dividerOpacity,
            },
          ]}
        />

        {/* VERSION */}
        <Animated.Text style={[styles.version, { opacity: subtitleOpacity }]}>
          Version 1.0.0
        </Animated.Text>
      </Animated.View>

      {/* FOOTER : LOADING */}
      <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
        {/* Barre de progression */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: progressPercent },
            ]}
          />
        </View>

        {/* Texte + points */}
        <View style={styles.footerBottom}>
          <Text style={styles.footerTxt}>Chargement</Text>
          <View style={styles.dotsContainer}>
            <LoadingDot delay={0} />
            <LoadingDot delay={200} />
            <LoadingDot delay={400} />
          </View>
        </View>
      </Animated.View>
    </View>
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
            toValue: 0.6,
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

// ============ POINTS DE CHARGEMENT ============
function LoadingDot({ delay }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          delay,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  // Cercles décoratifs
  bgCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -150,
    left: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -120,
    right: -100,
  },
  bgCircle3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.03)',
    top: '40%',
    right: -60,
  },

  // Particules
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },

  // Contenu central
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Ring pulsant
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  // Logo
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    ...SHADOW.lg,
  },

  // Titre
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: SPACING.xl,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  // Sous-titre
  subtitle: {
    fontSize: FONT.md,
    color: 'rgba(255,255,255,0.85)',
    marginTop: SPACING.sm,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Ligne de séparation
  divider: {
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginTop: SPACING.lg,
    borderRadius: 1,
  },

  // Version
  version: {
    fontSize: FONT.xs,
    color: 'rgba(255,255,255,0.6)',
    marginTop: SPACING.sm,
    fontWeight: '500',
    letterSpacing: 1,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    width: '80%',
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  footerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerTxt: {
    fontSize: FONT.sm,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#fff',
  },
});
