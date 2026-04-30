import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/theme/ThemeProvider';
import { spacing, radius } from '../../src/theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const slides = [
  {
    id: 'privacy',
    title: 'Privacy first',
    body: 'Your receipts and financial data stay on your device. No cloud AI, no data sharing. Ever.',
  },
  {
    id: 'snap',
    title: 'Snap a receipt',
    body: 'Point your camera at any receipt and get a categorised transaction in under two seconds.',
  },
  {
    id: 'budget',
    title: 'Budget with clarity',
    body: 'Set monthly envelopes, track by category, and stay on top of your spending — all offline.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const isLast = currentIndex === slides.length - 1;

  const onNext = () => {
    if (isLast) {
      router.replace('/onboarding/permissions' as any);
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceBase }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        getItemLayout={(_data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={[styles.iconCircle, { borderColor: colors.brandPrimary }]}>
              <Text style={[styles.iconText, { color: colors.brandPrimary }]}>
                {item.id === 'privacy' ? '🔒' : item.id === 'snap' ? '📷' : '📊'}
              </Text>
            </View>
            <Text style={[styles.title, { color: colors.ink900 }]}>{item.title}</Text>
            <Text style={[styles.body, { color: colors.ink700 }]}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    idx === currentIndex ? colors.brandPrimary : colors.strokeSubtle,
                },
              ]}
            />
          ))}
        </View>

        <Pressable onPress={onNext} accessibilityRole="button" accessibilityLabel={isLast ? 'Get started' : 'Next'}>
          <LinearGradient
            colors={[colors.brandPrimary, colors.brandSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextLabel}>{isLast ? 'Get started' : 'Next'}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  nextLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
