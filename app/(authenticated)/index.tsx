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
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, RingProgress, Screen, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) {
    return 'בוקר טוב';
  }
  if (h < 18) {
    return 'צהריים טובים';
  }
  return 'ערב טוב';
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const home = useQuery(api.stats.getHome);

  const readiness = home?.readiness ?? 0;
  const passHigh = readiness >= 80;

  return (
    <Screen edges={[]} style={{ backgroundColor: palette.primary }}>
      {/* כותרת עליונה — נמתחת מאחורי פס הסטטוס */}
      <View
        style={{
          flexDirection: rtl.flexDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 12,
        }}
      >
        <Pressable hitSlop={10}>
          <Bell color="#fff" size={24} />
        </Pressable>
        <T color="#fff" weight="bold" size={20}>
          תיאוריה
        </T>
        <Pressable
          hitSlop={10}
          onPress={() => router.push('/(authenticated)/settings')}
        >
          <Menu color="#fff" size={26} />
        </Pressable>
      </View>

      <ScrollView
        style={{ backgroundColor: '#F4F5F7' }}
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 16 }}
      >
        {/* ברכה + רצף */}
        <View
          style={{
            flexDirection: rtl.flexDirection,
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1 }}>
            <T weight="bold" size={22}>
              {greeting()}, {home?.name ?? 'תלמיד'}! 🚗
            </T>
            <T color={palette.muted} size={14} style={{ marginTop: 2 }}>
              {home
                ? `אתה קרוב ב-${readiness}% למוכנות מלאה למבחן`
                : 'טוען את הנתונים שלך…'}
            </T>
          </View>
          {home && home.streakDays > 0 ? (
            <View
              style={{
                backgroundColor: '#FFE7CC',
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <T color={palette.warning} weight="bold" size={13}>
                🔥 רצף {home.streakDays} ימים
              </T>
            </View>
          ) : null}
        </View>

        {/* כרטיס מוכנות */}
        <Card>
          <View
            style={{
              alignSelf: rtl.textAlign === 'right' ? 'flex-end' : 'flex-start',
              backgroundColor: passHigh
                ? palette.successBg
                : palette.primaryTint,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 5,
              marginBottom: 10,
            }}
          >
            <T
              size={12}
              weight="bold"
              color={passHigh ? palette.success : palette.primary}
            >
              {home?.readinessLabel ?? 'מחשב מוכנות…'}
            </T>
          </View>
          <T weight="bold" size={20} style={{ marginBottom: 12 }}>
            ציון מוכנות למבחן
          </T>
          <View
            style={{
              flexDirection: rtl.flexDirection,
              alignItems: 'center',
              gap: 16,
            }}
          >
            <RingProgress value={readiness} label="מוכנות" size={120} />
            <View style={{ flex: 1 }}>
              <T color={palette.muted} size={13}>
                {home && home.questionsToBoost > 0
                  ? `מענה על עוד ${home.questionsToBoost} שאלות מחזק את הסיכוי שלך לעבור בטסט הראשון.`
                  : 'המשך לתרגל כדי לשמור על המוכנות.'}
              </T>
              {home?.weeklyDelta !== null && home?.weeklyDelta !== undefined ? (
                <T
                  weight="bold"
                  size={13}
                  color={
                    home.weeklyDelta >= 0 ? palette.success : palette.danger
                  }
                  style={{ marginTop: 10 }}
                >
                  {home.weeklyDelta >= 0 ? '↗ +' : '↘ '}
                  {home.weeklyDelta}% השבוע
                </T>
              ) : null}
            </View>
          </View>
        </Card>

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
            onPress={() => router.push('/(authenticated)/quiz?mode=simulation')}
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
