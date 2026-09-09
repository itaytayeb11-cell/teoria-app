import { useQuery } from 'convex/react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  BookOpenCheck,
  History,
  ListChecks,
  Menu,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Card, Screen, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { licenseLabel } from '@/constants/licenses';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

export default function HomeScreen() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const qCount = useQuery(api.questions.count);
  const name = user?.fullName || user?.email?.split('@')[0] || 'תלמיד';

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View
          style={{
            flexDirection: rtl.flexDirection,
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 16,
          }}
        >
          <Pressable
            onPress={() => router.push('/(authenticated)/settings')}
            hitSlop={12}
          >
            <Menu color={palette.primary} size={28} />
          </Pressable>
          <T weight="bold" size={22}>
            שלום, {name}
          </T>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <LinearGradient
            colors={[palette.primary, palette.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 18, padding: 20 }}
          >
            <T color="#fff" weight="bold" size={24} style={{ marginBottom: 8 }}>
              מוכנים למבחן התאוריה?
            </T>
            <T color="rgba(255,255,255,0.9)" size={14}>
              {qCount
                ? `${qCount.active.toLocaleString('he-IL')} שאלות מהמאגר הרשמי של משרד התחבורה. תרגלו עד שתגיעו מוכנים.`
                : 'המאגר הרשמי של משרד התחבורה, בתוך האפליקציה.'}
            </T>
          </LinearGradient>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
          <Tile
            label="תרגול שאלות"
            icon={<ListChecks color={palette.primary} size={30} />}
            onPress={() => router.push('/(authenticated)/practice')}
          />
          <Tile
            label="מבחן מלא"
            icon={<BookOpenCheck color={palette.primary} size={30} />}
            onPress={() => router.push('/(authenticated)/quiz?mode=simulation')}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16 }}>
          <Tile
            label="מעקב התקדמות"
            icon={<BarChart3 color={palette.primary} size={30} />}
            onPress={() => router.push('/(authenticated)/stats')}
          />
          <Tile
            label="היסטוריית מבחנים"
            icon={<History color={palette.primary} size={30} />}
            onPress={() => router.push('/(authenticated)/history')}
          />
        </View>

        <View style={{ padding: 16 }}>
          <Card onPress={() => router.push('/(authenticated)/license')}>
            <T weight="medium" style={{ marginBottom: 4 }}>
              סוג הרישיון: {licenseLabel(user?.licenseType ?? undefined)}
            </T>
            <T color={palette.primary} size={13}>
              החלף סוג רישיון
            </T>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Tile(props: { label: string; icon: ReactNode; onPress: () => void }) {
  return (
    <Card
      onPress={props.onPress}
      style={{ flex: 1, alignItems: 'center', paddingVertical: 22 }}
    >
      {props.icon}
      <T weight="bold" size={16} center style={{ marginTop: 12 }}>
        {props.label}
      </T>
    </Card>
  );
}
