// ============================================================================
// רכיבי דף הבית — יהלום (רצף), טבעת-קרוסלה (מדדים), טרופי (ניקוד),
// וקרוסלת נושאים. שימוש ייעודי ל-app/(authenticated)/index.tsx בלבד.
// בנוי כדי להתאים במדויק למבנה של אפליקציית הרפרנס (רק בגוון כחול).
// ============================================================================
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ProgressBar, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { CAT_ICON } from '@/constants/categories';
import { rtl } from '@/lib/rtl';

// ----------------------------------------------------------------------------
// תג צדדי — אמוג'י גולמי + מספר, בלי רקע ובלי כיתוב מתחת (בדיוק כמו הרפרנס)
// ----------------------------------------------------------------------------
export function StatBadge(props: {
  emoji: string;
  value: number | string;
  color: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={{ alignItems: 'center', width: 64 }}>
      <T size={30}>{props.emoji}</T>
      <T weight="bold" size={19} style={{ marginTop: 4 }} color={props.color}>
        {props.value}
      </T>
    </View>
  );
  if (!props.onPress) {
    return content;
  }
  return (
    <Pressable onPress={props.onPress} hitSlop={6}>
      {content}
    </Pressable>
  );
}

// ----------------------------------------------------------------------------
// טבעת בודדת — עיגול רקע דק + קשת התקדמות (אופציונלי, רק למוכנות %) + תוכן במרכז
// ----------------------------------------------------------------------------
function Ring(props: {
  size: number;
  value?: number; // 0-100, קשת התקדמות אמיתית
  color: string;
  children: ReactNode;
}) {
  const stroke = 6;
  const r = (props.size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct =
    props.value !== undefined ? Math.max(0, Math.min(100, props.value)) : 100;
  return (
    <View
      style={{
        width: props.size,
        height: props.size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg
        width={props.size}
        height={props.size}
        style={{ position: 'absolute' }}
      >
        <Circle
          cx={props.size / 2}
          cy={props.size / 2}
          r={r}
          stroke="#E7EAF3"
          strokeWidth={stroke}
          fill="none"
        />
        {props.value !== undefined ? (
          <Circle
            cx={props.size / 2}
            cy={props.size / 2}
            r={r}
            stroke={props.color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={circ * (1 - pct / 100)}
            transform={`rotate(-90 ${props.size / 2} ${props.size / 2})`}
          />
        ) : null}
      </Svg>
      {props.children}
    </View>
  );
}

export type MetricPage = {
  key: string;
  ringValue?: number; // אם קיים — נצייר קשת התקדמות אמיתית (רק למוכנות %)
  ringColor: string;
  value: string; // הטקסט/מספר הגדול במרכז
  label: string; // כיתוב קטן מתחת לקו המפריד
};

// ----------------------------------------------------------------------------
// קרוסלת מדדים — טבעת אחת שמחליפים בין 4 מדדים בלחיצה עליה, עם "קפיצה"
// עדינה (התכווצות+דהייה ואז חזרה) בין מדד למדד — לא רק חילוף מסך יבש.
// ----------------------------------------------------------------------------
export function MetricRingCarousel(props: {
  size: number;
  pages: MetricPage[];
}) {
  const { size, pages } = props;
  const [index, setIndex] = useState(0);
  const anim = useRef(new Animated.Value(1)).current;

  const goTo = (i: number) => {
    if (i === index) {
      return;
    }
    Animated.timing(anim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setIndex(i);
      Animated.spring(anim, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }).start();
    });
  };

  const active = pages[index];
  const next = () => goTo((index + 1) % pages.length);

  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable onPress={next} hitSlop={4}>
        <Ring size={size} value={active.ringValue} color={active.ringColor}>
          <Animated.View
            style={{
              alignItems: 'center',
              opacity: anim,
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            }}
          >
            <T
              weight="bold"
              size={active.value.length > 3 ? size * 0.14 : size * 0.22}
              color={active.ringColor}
              center
            >
              {active.value}
            </T>
            <View
              style={{
                width: 18,
                height: 2,
                borderRadius: 1,
                backgroundColor: '#D8DCE6',
                marginVertical: 5,
              }}
            />
            <T color={palette.muted} size={11}>
              {active.label}
            </T>
          </Animated.View>
        </Ring>
      </Pressable>
    </View>
  );
}

// ----------------------------------------------------------------------------
// קרוסלת נושאים — כרטיס כחול מלא-רוחב לכל נושא (אחוז גדול, שם נושא, פס
// התקדמות, כפתור שחור), בדיוק כמו כרטיס "X מתוך Y שיעורים" ברפרנס.
// ----------------------------------------------------------------------------
export function CategoryCarousel(props: {
  categories: { category: string; count: number }[];
  accuracyByCat: Record<string, number>;
}) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== cardWidth) {
      setCardWidth(w);
    }
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!cardWidth) {
      return;
    }
    const i = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
    setPage(Math.max(0, Math.min(props.categories.length - 1, i)));
  };

  return (
    <View onLayout={onLayout}>
      {cardWidth > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth}
          decelerationRate="fast"
          onMomentumScrollEnd={onScrollEnd}
        >
          {props.categories.map((cat) => {
            const acc = props.accuracyByCat[cat.category];
            return (
              <View key={cat.category} style={{ width: cardWidth }}>
                <LinearGradient
                  colors={[palette.primary, palette.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 20, padding: 18, marginRight: 2 }}
                >
                  <View
                    style={{
                      flexDirection: rtl.flexDirection,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <T color="#fff" weight="bold" size={32}>
                      {acc !== undefined ? `${acc}%` : '—'}
                    </T>
                    <View
                      style={{
                        alignItems:
                          rtl.textAlign === 'right' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <View
                        style={{
                          flexDirection: rtl.flexDirection,
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <T size={17}>{CAT_ICON[cat.category] ?? '•'}</T>
                        <T color="#fff" weight="bold" size={15}>
                          {cat.category}
                        </T>
                      </View>
                      <T
                        color="rgba(255,255,255,0.8)"
                        size={12}
                        style={{ marginTop: 2 }}
                      >
                        {cat.count} שאלות בנושא
                      </T>
                    </View>
                  </View>
                  <View style={{ marginTop: 16 }}>
                    <ProgressBar
                      value={(acc ?? 0) / 100}
                      track="rgba(255,255,255,0.25)"
                      fill="#fff"
                    />
                  </View>
                  <Pressable
                    onPress={() =>
                      router.push(
                        `/(authenticated)/quiz?mode=practice&filter=${encodeURIComponent(cat.category)}`
                      )
                    }
                    style={{
                      marginTop: 16,
                      backgroundColor: '#12151C',
                      borderRadius: 999,
                      height: 46,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: rtl.flexDirection,
                      gap: 6,
                    }}
                  >
                    <T color="#fff" weight="bold" size={14}>
                      תרגל נושא
                    </T>
                    <ChevronLeft color="#fff" size={16} />
                  </Pressable>
                </LinearGradient>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={{ height: 190 }} />
      )}
      {props.categories.length > 1 ? (
        <View
          style={{
            flexDirection: rtl.flexDirection,
            justifyContent: 'center',
            gap: 5,
            marginTop: 10,
          }}
        >
          {props.categories.map((c, i) => (
            <View
              key={c.category}
              style={{
                width: i === page ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === page ? palette.primary : '#D8DCE6',
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
