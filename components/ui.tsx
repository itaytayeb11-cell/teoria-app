// ============================================================================
// ערכת קומפוננטות בסיס — מבוססת על docs/design.md
// ============================================================================
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '@/constants/Colors';
import { useAppColors } from '@/constants/theme';
import { rtl } from '@/lib/rtl';

// ----------------------------------------------------------------------------
// RingProgress — טבעת התקדמות עגולה עם אחוז במרכז
// ----------------------------------------------------------------------------
export function RingProgress(props: {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  color?: string;
}) {
  const size = props.size ?? 140;
  const stroke = props.strokeWidth ?? 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, props.value));
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={palette.primaryTint}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={props.color ?? palette.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text
        style={{
          fontSize: size * 0.24,
          fontWeight: '800',
          color: palette.primary,
        }}
      >
        {Math.round(pct)}%
      </Text>
      {props.label ? (
        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
          {props.label}
        </Text>
      ) : null}
    </View>
  );
}

// ----------------------------------------------------------------------------
// טקסט מיושר-ימין כברירת מחדל (RTL)
// ----------------------------------------------------------------------------
export function T(props: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  weight?: 'regular' | 'medium' | 'bold';
  size?: number;
  color?: string;
  center?: boolean;
  numberOfLines?: number;
}) {
  const c = useAppColors();
  const fontWeight =
    props.weight === 'bold' ? '700' : props.weight === 'medium' ? '600' : '400';
  return (
    <Text
      numberOfLines={props.numberOfLines}
      style={[
        {
          color: props.color ?? c.text,
          fontSize: props.size ?? 16,
          fontWeight,
          textAlign: props.center ? 'center' : rtl.textAlign,
          writingDirection: 'rtl',
        },
        props.style,
      ]}
    >
      {props.children}
    </Text>
  );
}

// ----------------------------------------------------------------------------
// Screen — עוטף מסך עם רקע ובטיחות שוליים
// ----------------------------------------------------------------------------
export function Screen(props: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const c = useAppColors();
  return (
    <SafeAreaView
      edges={props.edges ?? ['top', 'bottom']}
      style={[{ flex: 1, backgroundColor: c.background }, props.style]}
    >
      {props.children}
    </SafeAreaView>
  );
}

// ----------------------------------------------------------------------------
// ScreenHeader — פאנל כחול עם פינה תחתונה מעוגלת
// ----------------------------------------------------------------------------
export function ScreenHeader(props: {
  title: string;
  highlight?: string; // מילה מודגשת בסוף הכותרת
  onBack?: () => void;
  backLabel?: string;
  hideBack?: boolean; // למסכי טאב שאין להם חזרה
  right?: ReactNode;
  compact?: boolean;
  children?: ReactNode; // תוכן נוסף בתוך הפאנל (פרוגרס וכו')
}) {
  const router = useRouter();
  const back = props.onBack ?? (() => router.back());
  return (
    <LinearGradient
      colors={[palette.primary, palette.primaryDark]}
      style={[styles.header, props.compact && { paddingBottom: 16 }]}
    >
      <View style={styles.headerRow}>
        {props.right ?? <View style={{ width: 28 }} />}
        {props.hideBack ? (
          <View style={{ width: 28 }} />
        ) : (
          <Pressable
            onPress={back}
            hitSlop={12}
            style={{ flexDirection: rtl.flexDirection, alignItems: 'center' }}
          >
            {props.backLabel ? (
              <Text style={styles.backLabel}>{props.backLabel}</Text>
            ) : null}
            <ChevronRight color="#fff" size={26} />
          </Pressable>
        )}
      </View>
      <Text style={styles.headerTitle}>
        {props.title}
        {props.highlight ? (
          <Text style={{ fontWeight: '800' }}> {props.highlight}</Text>
        ) : null}
      </Text>
      {props.children}
    </LinearGradient>
  );
}

// ----------------------------------------------------------------------------
// Card
// ----------------------------------------------------------------------------
export function Card(props: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const c = useAppColors();
  const body = (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderRadius: 16,
          padding: 16,
          shadowColor: '#1B2B4B',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        props.style,
      ]}
    >
      {props.children}
    </View>
  );
  if (props.onPress) {
    return <Pressable onPress={props.onPress}>{body}</Pressable>;
  }
  return body;
}

// ----------------------------------------------------------------------------
// Button
// ----------------------------------------------------------------------------
export function Button(props: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'soft' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const variant = props.variant ?? 'primary';
  const bg =
    variant === 'primary'
      ? palette.primary
      : variant === 'soft'
        ? palette.primarySoft
        : variant === 'danger'
          ? palette.danger
          : 'transparent';
  const border = variant === 'outline' ? palette.primary : 'transparent';
  const fg = variant === 'outline' ? palette.primary : '#fff';
  const disabled = props.disabled || props.loading;
  return (
    <Pressable
      onPress={props.onPress}
      disabled={disabled}
      android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
      style={[
        {
          width: '100%',
          alignSelf: 'stretch',
          backgroundColor: bg,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: border,
          borderRadius: 14,
          minHeight: 52,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        props.style,
      ]}
    >
      {props.loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text
          style={{
            color: fg,
            fontSize: 17,
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          {props.label}
        </Text>
      )}
    </Pressable>
  );
}

// ----------------------------------------------------------------------------
// AnswerOption — כרטיס תשובה עם מצבי נכון/שגוי
// ----------------------------------------------------------------------------
export function AnswerOption(props: {
  text: string;
  state: 'default' | 'selected' | 'correct' | 'wrong';
  onPress?: () => void;
  disabled?: boolean;
}) {
  const c = useAppColors();
  const { state } = props;
  const bg =
    state === 'correct'
      ? palette.successBg
      : state === 'wrong'
        ? palette.dangerBg
        : state === 'selected'
          ? palette.primaryTint
          : c.card;
  const borderColor =
    state === 'correct'
      ? palette.success
      : state === 'wrong'
        ? palette.danger
        : state === 'selected'
          ? palette.primary
          : c.border;
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={{
        width: '100%',
        alignSelf: 'stretch',
        backgroundColor: bg,
        borderWidth: 1.5,
        borderColor,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 16,
        flexDirection: rtl.flexDirection,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#1B2B4B',
        shadowOpacity: state === 'default' ? 0.05 : 0,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: state === 'default' ? 1 : 0,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor:
            state === 'correct'
              ? palette.success
              : state === 'wrong'
                ? palette.danger
                : state === 'selected'
                  ? palette.primary
                  : '#C7CBD4',
          backgroundColor:
            state === 'correct'
              ? palette.success
              : state === 'wrong'
                ? palette.danger
                : state === 'selected'
                  ? palette.primary
                  : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {(state === 'correct' || state === 'selected') && (
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>
            ✓
          </Text>
        )}
        {state === 'wrong' && (
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>
            ✕
          </Text>
        )}
      </View>
      <Text
        style={{
          flex: 1,
          color: c.text,
          fontSize: 16,
          textAlign: rtl.textAlign,
          writingDirection: 'rtl',
        }}
      >
        {props.text}
      </Text>
    </Pressable>
  );
}

// ----------------------------------------------------------------------------
// ProgressBar
// ----------------------------------------------------------------------------
export function ProgressBar(props: {
  value: number;
  track?: string;
  fill?: string;
}) {
  const pct = Math.max(0, Math.min(1, props.value));
  return (
    <View
      style={{
        height: 6,
        borderRadius: 3,
        backgroundColor: props.track ?? 'rgba(255,255,255,0.3)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          borderRadius: 3,
          backgroundColor: props.fill ?? '#fff',
        }}
      />
    </View>
  );
}

// ----------------------------------------------------------------------------
// GuestBanner — אזהרת מצב אורח
// ----------------------------------------------------------------------------
export function GuestBanner(props: { text?: string }) {
  return (
    <View
      style={{
        flexDirection: rtl.flexDirection,
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFF4E5',
        borderRadius: 10,
        padding: 10,
      }}
    >
      <Text style={{ fontSize: 16 }}>⚠️</Text>
      <Text
        style={{
          flex: 1,
          color: palette.warning,
          fontSize: 13,
          textAlign: rtl.textAlign,
        }}
      >
        {props.text ?? 'אתה משתמש כאורח — ההתקדמות שלך לא תישמר!'}
      </Text>
    </View>
  );
}

// ----------------------------------------------------------------------------
// ConfirmModal
// ----------------------------------------------------------------------------
export function ConfirmModal(props: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const c = useAppColors();
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      onRequestClose={props.onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(15,20,32,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: c.card,
            borderRadius: 20,
            padding: 22,
            width: '100%',
          }}
        >
          <Text
            style={{
              color: c.text,
              fontSize: 20,
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {props.title}
          </Text>
          <Text
            style={{
              color: c.textSecondary,
              fontSize: 15,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            {props.message}
          </Text>
          <Button
            label={props.confirmLabel ?? 'אישור'}
            onPress={props.onConfirm}
          />
          <View style={{ height: 10 }} />
          <Button
            label={props.cancelLabel ?? 'ביטול'}
            variant="outline"
            onPress={props.onCancel}
          />
        </View>
      </View>
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// NavArrows — כפתורי קודם/הבא (מבחן)
// ----------------------------------------------------------------------------
export function NavArrows(props: {
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  const box: ViewStyle = {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  };
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Pressable
        onPress={props.onPrev}
        disabled={props.prevDisabled}
        style={[box, { opacity: props.prevDisabled ? 0.4 : 1 }]}
      >
        <ChevronRight color={palette.primary} size={24} />
      </Pressable>
      <Pressable
        onPress={props.onNext}
        disabled={props.nextDisabled}
        style={[box, { opacity: props.nextDisabled ? 0.4 : 1 }]}
      >
        <ChevronLeft color={palette.primary} size={24} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '700',
    textAlign: rtl.textAlign,
    marginTop: 10,
    writingDirection: 'rtl',
  },
  backLabel: { color: '#fff', fontSize: 16, marginHorizontal: 4 },
});
