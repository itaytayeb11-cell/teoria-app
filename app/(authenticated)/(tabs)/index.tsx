import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  Bell,
  Bookmark,
  ChevronLeft,
  Menu,
  Play,
  Shapes,
  TrafficCone,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import { AppDrawer } from '@/components/AppDrawer';
import {
  CategoryCarousel,
  type MetricPage,
  MetricRingCarousel,
  StatBadge,
} from '@/components/HomeWidgets';
import { Card, ConfirmModal, Screen, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

const TEST_DATE_REMINDER_KEY = 'testDateReminderShownOn';

// לוגו האפליקציה — משולש כחול עם האות "ל" בתוכו, ליד השם בכותרת
function LogoMark() {
  const size = 24;
  return (
    <View
      style={{
        width: size + 2,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg
        width={size + 2}
        height={size}
        viewBox={`0 0 ${size + 2} ${size}`}
        style={{ position: 'absolute' }}
      >
        <Polygon
          points={`${(size + 2) / 2},1 ${size + 1},${size - 1} 1,${size - 1}`}
          fill={palette.primary}
          stroke="#fff"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </Svg>
      <T color="#fff" weight="bold" size={12} style={{ marginTop: 3 }}>
        ל
      </T>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const home = useQuery(api.stats.getHome);
  const activeSession = useQuery(api.quiz.getActiveSession);
  // הנושאים מגיעים מ-getHome עצמו (לא עוד שאילתה נפרדת שסורקת שוב את כל
  // המאגר) — חוסך סריקה כפולה של 1,800+ שאלות בכל טעינה של דף הבית
  const categories = home?.categories;
  const stats = useQuery(api.stats.getMyStats);
  const [showDateReminder, setShowDateReminder] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const testDate = home?.testDate;
  // תזכורת פעם ביום (לא בכל פתיחה) כל עוד לא נקבע תאריך מבחן
  useEffect(() => {
    if (testDate === undefined || testDate !== null) {
      return;
    }
    let cancelled = false;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const last = await AsyncStorage.getItem(TEST_DATE_REMINDER_KEY);
      if (!cancelled && last !== today) {
        await AsyncStorage.setItem(TEST_DATE_REMINDER_KEY, today);
        setShowDateReminder(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [testDate]);

  const readiness = home?.readiness ?? 0;

  const accuracyByCat: Record<string, number> = {};
  for (const c of stats?.categoryBreakdown ?? []) {
    accuracyByCat[c.category] = c.accuracy;
  }

  const daysToTestValue =
    home?.daysToTest === null || home?.daysToTest === undefined
      ? 'לא הוגדר'
      : home.daysToTest <= 0
        ? 'היום'
        : String(home.daysToTest);

  const metricPages: MetricPage[] = [
    {
      key: 'readiness',
      ringValue: readiness,
      ringColor: palette.primary,
      value: `${readiness}%`,
      label: 'מוכנות',
    },
    {
      key: 'daysToTest',
      ringColor: palette.warning,
      value: daysToTestValue,
      label: 'ימים למבחן',
    },
    {
      key: 'passed',
      ringColor: palette.success,
      value: String(home?.passedSimCount ?? 0),
      label: 'מבחנים שעברת',
    },
    {
      key: 'failed',
      ringColor: palette.danger,
      value: String(home?.failedSimCount ?? 0),
      label: 'מבחנים שנכשלת',
    },
  ];

  return (
    <Screen edges={[]}>
      {/* רקע כללי למסך: לבן למעלה, דוהה לגוונים של כחול ככל שיורדים */}
      <LinearGradient colors={['#FFFFFF', '#87A9EE']} style={{ flex: 1 }}>
        {/* כותרת עליונה — כחול מלא (כמו במקור), לא בהיר */}
        <LinearGradient
          colors={[palette.primaryDark, palette.primary]}
          style={{
            flexDirection: rtl.flexDirection,
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: insets.top + 8,
            paddingBottom: 12,
          }}
        >
          <Pressable hitSlop={10} onPress={() => setDrawerOpen(true)}>
            <Menu color="#fff" size={24} />
          </Pressable>
          <View
            style={{
              flex: 1,
              flexDirection: rtl.flexDirection,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <T color="#fff" weight="bold" size={19}>
              תיאוריה
            </T>
            <LogoMark />
          </View>
          <Pressable hitSlop={10}>
            <Bell color="#fff" size={22} />
          </Pressable>
        </LinearGradient>

        <ScrollView
          style={{ backgroundColor: 'transparent' }}
          contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 16 }}
        >
          {/* שורת ווידג'טים — יהלום (רצף) / טבעת-קרוסלה (מדדים) / טרופי (ניקוד).
              כל פריט בפני עצמו בלי רקע — משתקף על גבי גרדיאנט המסך */}
          <View
            style={{
              flexDirection: rtl.flexDirection,
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 4,
            }}
          >
            <StatBadge
              emoji="💎"
              value={home?.streakDays ?? 0}
              color={palette.primary}
              onPress={() => router.push('/(authenticated)/streak')}
            />
            <MetricRingCarousel size={128} pages={metricPages} />
            <StatBadge
              emoji="🏆"
              value={home?.correctAnswered ?? 0}
              color={palette.warning}
              onPress={() => router.push('/(authenticated)/leaderboard')}
            />
          </View>

          {/* קרוסלת נושאים */}
          {categories && categories.length > 0 ? (
            <View style={{ gap: 10 }}>
              <T weight="bold" size={15}>
                התקדמות לפי נושא
              </T>
              <CategoryCarousel
                categories={categories}
                accuracyByCat={accuracyByCat}
              />
            </View>
          ) : null}

          {/* מבחן שנקטע — אפשרות להמשיך */}
          {activeSession && activeSession.answers.length > 0 ? (
            <Card
              onPress={() =>
                router.push(`/(authenticated)/quiz?resume=${activeSession._id}`)
              }
              style={{
                flexDirection: rtl.flexDirection,
                alignItems: 'center',
                gap: 12,
                backgroundColor: palette.primaryTint,
              }}
            >
              <T size={22}>⏸️</T>
              <View style={{ flex: 1 }}>
                <T weight="bold" size={15}>
                  {activeSession.mode === 'simulation'
                    ? 'מבחן מדמה שנקטע'
                    : 'תרגול שנקטע'}
                </T>
                <T color={palette.muted} size={13}>
                  {activeSession.answers.length} מתוך{' '}
                  {activeSession.totalQuestions} שאלות — המשך מאיפה שעצרת
                </T>
              </View>
              <ChevronLeft color={palette.primary} size={20} />
            </Card>
          ) : null}

          {/* מבחן מדמה */}
          <LinearGradient
            colors={[palette.primary, palette.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 18, padding: 18 }}
          >
            <T color="rgba(255,255,255,0.85)" size={12}>
              ⏱ סימולציה רשמית משרד הרישוי
            </T>
            <T color="#fff" weight="bold" size={22} style={{ marginTop: 4 }}>
              מבחן תיאוריה אמיתי
            </T>
            <T color="rgba(255,255,255,0.9)" size={13} style={{ marginTop: 4 }}>
              30 שאלות אקראיות • 40 דקות • עד 4 שגיאות למעבר
            </T>
            <Pressable
              onPress={() =>
                router.push('/(authenticated)/quiz?mode=simulation')
              }
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                height: 50,
                marginTop: 14,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: rtl.flexDirection,
                gap: 8,
              }}
            >
              <Play color={palette.primary} size={18} fill={palette.primary} />
              <T color={palette.primary} weight="bold" size={16}>
                התחל מבחן עכשיו
              </T>
            </Pressable>
          </LinearGradient>

          {/* גריד פעולות */}
          <View style={{ flexDirection: rtl.flexDirection, gap: 12 }}>
            <FeatureCard
              title="לוח תמרורים"
              subtitle="250+ תמרורים רשמיים"
              action="צפה במילון"
              actionColor={palette.warning}
              iconBg="#FDEBCF"
              icon={<TrafficCone color={palette.warning} size={22} />}
              onPress={() => router.push('/(authenticated)/signs')}
            />
            <FeatureCard
              title="תרגול נושאים"
              subtitle="זכות קדימה, רכב ועוד"
              action="התחל תרגול"
              actionColor={palette.primary}
              iconBg="#E4EAFB"
              icon={<Shapes color={palette.primary} size={22} />}
              onPress={() => router.push('/(authenticated)/practice')}
            />
          </View>
          <View style={{ flexDirection: rtl.flexDirection, gap: 12 }}>
            <FeatureCard
              title="שאלות שמורות"
              subtitle={`${home?.savedCount ?? 0} שאלות לשינון חוזר`}
              action="תרגל שמורים"
              actionColor={palette.success}
              iconBg="#D4F5E2"
              icon={<Bookmark color={palette.success} size={22} />}
              onPress={() => router.push('/(authenticated)/saved')}
            />
            <FeatureCard
              title="מחסן הטעויות"
              subtitle="חיזוק נקודות תורפה"
              action="תקן טעויות"
              actionColor={palette.danger}
              iconBg="#FCE0E0"
              icon={<AlertCircle color={palette.danger} size={22} />}
              badge={
                home && home.mistakeCount > 0
                  ? `${home.mistakeCount} שגיאות`
                  : undefined
              }
              onPress={() => router.push('/(authenticated)/mistakes')}
            />
          </View>

          {/* סיכום התקדמות */}
          <Card>
            <View
              style={{
                flexDirection: rtl.flexDirection,
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Pressable onPress={() => router.push('/(authenticated)/stats')}>
                <T color={palette.primary} weight="bold" size={13}>
                  סטטיסטיקה מלאה
                </T>
              </Pressable>
              <T weight="bold" size={17}>
                סיכום התקדמות אישי
              </T>
            </View>
            <View style={{ flexDirection: rtl.flexDirection, gap: 10 }}>
              <MiniStat value={home?.totalQuizzes ?? 0} label="מבחנים עברו" />
              <MiniStat
                value={home?.mistakeCount ?? 0}
                label="לתיקון"
                color={palette.danger}
              />
              <MiniStat
                value={home?.correctAnswered ?? 0}
                label="נענו נכון"
                color={palette.success}
              />
            </View>
          </Card>
        </ScrollView>

        <ConfirmModal
          visible={showDateReminder}
          title="מתי מבחן התאוריה שלך?"
          message="קביעת תאריך עוזרת לנו להראות לך כמה זמן נשאר עד המבחן. אפשר לקבוע אותו עכשיו או בהמשך מההגדרות."
          confirmLabel="קבע תאריך"
          cancelLabel="אחר כך"
          onConfirm={() => {
            setShowDateReminder(false);
            router.push('/(authenticated)/license');
          }}
          onCancel={() => setShowDateReminder(false)}
        />

        <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </LinearGradient>
    </Screen>
  );
}

function FeatureCard(props: {
  title: string;
  subtitle: string;
  action: string;
  actionColor: string;
  iconBg: string;
  icon: ReactNode;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={props.onPress} style={{ flex: 1, gap: 8 }}>
      <View
        style={{
          flexDirection: rtl.flexDirection,
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: props.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {props.icon}
        </View>
        {props.badge ? (
          <View
            style={{
              backgroundColor: palette.danger,
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <T color="#fff" size={10} weight="bold">
              {props.badge}
            </T>
          </View>
        ) : null}
      </View>
      <T weight="bold" size={16}>
        {props.title}
      </T>
      <T color={palette.muted} size={12}>
        {props.subtitle}
      </T>
      <View
        style={{
          flexDirection: rtl.flexDirection,
          alignItems: 'center',
          gap: 4,
          marginTop: 2,
        }}
      >
        <T color={props.actionColor} weight="bold" size={13}>
          {props.action}
        </T>
        <ChevronLeft color={props.actionColor} size={16} />
      </View>
    </Card>
  );
}

function MiniStat(props: { value: number; label: string; color?: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F1F3FB',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
      }}
    >
      <T weight="bold" size={20} color={props.color ?? palette.primary}>
        {props.value}
      </T>
      <T color={palette.muted} size={11} center style={{ marginTop: 2 }}>
        {props.label}
      </T>
    </View>
  );
}
