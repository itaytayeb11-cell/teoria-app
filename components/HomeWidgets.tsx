// ============================================================================
// רכיבי דף הבית — יהלום (רצף), טבעת-קרוסלה (מדדים), טרופי (ניקוד),
// וקרוסלת נושאים. שימוש ייעודי ל-app/(authenticated)/index.tsx בלבד.
// ============================================================================
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Card, ProgressBar, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { CAT_ICON } from '@/constants/categories';
import { rtl } from '@/lib/rtl';

// ----------------------------------------------------------------------------
// תג צדדי עגול — יהלום (רצף) / טרופי (ניקוד)
// ----------------------------------------------------------------------------
export function StatBadge(props: {
  icon: ReactNode;
  value: number | string;
  label: string;
  tint: string;
  tintBg: string;
  dim?: boolean; // מוצג באפור כשאין עדיין נתון (למשל רצף 0)
}) {
  const tint = props.dim ? '#B7BDC9' : props.tint;
  const tintBg = props.dim ? '#F1F2F5' : props.tintBg;
  return (
    <View style={{ alignItems: 'center', width: 72 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: tintBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {props.icon}
      </View>
      <T weight="bold" size={16} style={{ marginTop: 6 }} color={tint}>
        {props.value}
      </T>
      <T color={palette.muted} size={11} center>
        {props.label}
      </T>
    </View>
  );
}

// ----------------------------------------------------------------------------
// טבעת בודדת — עיגול רקע + קשת התקדמות (אופציונלי) + תוכן במרכז
// ----------------------------------------------------------------------------
function Ring(props: {
  size: number;
  value?: number; // 0-100, קשת התקדמות אמיתית (למשל אחוז מוכנות)
  color: string;
  children: ReactNode;
}) {
  const stroke = 10;
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
          stroke="#EDEFF4"
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
  value: string; // המספר/טקסט הגדול במרכז
  label: string; // כיתוב קטן מתחת למספר
};

// ----------------------------------------------------------------------------
// קרוסלת מדדים — טבעת אחת שמחליפים בין 4 מדדים באמצעות החלקה או נקודות
// ----------------------------------------------------------------------------
export function MetricRingCarousel(props: {
  size: number;
  pages: MetricPage[];
}) {
  const { size, pages } = props;
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const raw = e.nativeEvent.contentOffset.x / size;
    const i = Math.round(Math.abs(raw));
    setIndex(Math.max(0, Math.min(pages.length - 1, i)));
  };

  const goTo = (i: number) => {
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * size, animated: true });
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        snapToInterval={size}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={{ width: size, height: size }}
      >
        {pages.map((p) => (
          <View
            key={p.key}
            style={{
              width: size,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ring size={size} value={p.ringValue} color={p.ringColor}>
              <T weight="bold" size={size * 0.19} color={p.ringColor}>
                {p.value}
              </T>
              <T color={palette.muted} size={11} style={{ marginTop: 2 }}>
                {p.label}
              </T>
            </Ring>
          </View>
        ))}
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          gap: 5,
          marginTop: 8,
        }}
      >
        {pages.map((p, i) => (
          <Pressable key={p.key} hitSlop={8} onPress={() => goTo(i)}>
            <View
              style={{
                width: i === index ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === index ? palette.primary : '#D8DCE6',
              }}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ----------------------------------------------------------------------------
// קרוסלת נושאים — מחליפה את "15 השיעורים" בגרסת המקור, לפי 4 הנושאים הרשמיים
// ----------------------------------------------------------------------------
export function CategoryCarousel(props: {
  categories: { category: string; count: number }[];
  accuracyByCat: Record<string, number>;
}) {
  const router = useRouter();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 2 }}
    >
      {props.categories.map((cat) => {
        const acc = props.accuracyByCat[cat.category];
        return (
          <Card
            key={cat.category}
            onPress={() =>
              router.push(
                `/(authenticated)/quiz?mode=practice&filter=${encodeURIComponent(cat.category)}`
              )
            }
            style={{ width: 168, gap: 8 }}
          >
            <View
              style={{
                flexDirection: rtl.flexDirection,
                alignItems: 'center',
                gap: 8,
              }}
            >
              <T size={20}>{CAT_ICON[cat.category] ?? '•'}</T>
              <T weight="bold" size={14} style={{ flex: 1 }} numberOfLines={1}>
                {cat.category}
              </T>
            </View>
            {acc !== undefined ? (
              <>
                <ProgressBar
                  value={acc / 100}
                  track="#EDEFF4"
                  fill={
                    acc >= 74
                      ? palette.success
                      : acc >= 50
                        ? palette.warning
                        : palette.danger
                  }
                />
                <T color={palette.muted} size={11}>
                  דיוק {acc}%
                </T>
              </>
            ) : (
              <T color={palette.muted} size={11}>
                עוד לא תרגלת בנושא הזה
              </T>
            )}
            <View
              style={{
                flexDirection: rtl.flexDirection,
                alignItems: 'center',
                gap: 4,
                marginTop: 2,
              }}
            >
              <T color={palette.primary} weight="bold" size={12}>
                תרגל נושא
              </T>
              <ChevronLeft color={palette.primary} size={14} />
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}
