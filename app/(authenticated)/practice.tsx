import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Shuffle, Target } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Card, ProgressBar, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

const CAT_ICON: Record<string, string> = {
  'חוקי התנועה': '📖',
  תמרורים: '🚸',
  בטיחות: '🛟',
  'הכרת הרכב': '🚗',
};

export default function PracticeScreen() {
  const router = useRouter();
  const categories = useQuery(api.questions.listCategories);
  const stats = useQuery(api.stats.getMyStats);

  const accuracyByCat: Record<string, number> = {};
  for (const c of stats?.categoryBreakdown ?? []) {
    accuracyByCat[c.category] = c.accuracy;
  }
  const weak = stats?.weakSubCategories ?? [];

  const go = (params: string) =>
    router.push(`/(authenticated)/quiz?mode=practice${params}`);

  return (
    <Screen edges={[]}>
      <ScreenHeader title="תרגול" highlight="שאלות" hideBack />
      {categories === undefined ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 14 }}
        >
          {/* תרגול מהיר */}
          <Card
            onPress={() => go('')}
            style={{
              flexDirection: rtl.flexDirection,
              alignItems: 'center',
              gap: 12,
              backgroundColor: palette.primaryTint,
            }}
          >
            <Shuffle color={palette.primary} size={24} />
            <View style={{ flex: 1 }}>
              <T weight="bold" size={16}>
                תרגול מעורב
              </T>
              <T color={palette.muted} size={13}>
                שאלות אקראיות מכל הנושאים, עם משוב מיידי
              </T>
            </View>
            <ChevronLeft color={palette.primary} size={20} />
          </Card>

          {/* חיזוק נקודות תורפה */}
          {weak.length > 0 ? (
            <View style={{ gap: 8 }}>
              <View
                style={{
                  flexDirection: rtl.flexDirection,
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Target color={palette.danger} size={16} />
                <T weight="bold" size={15}>
                  חיזוק נקודות תורפה
                </T>
              </View>
              {weak.map((w) => (
                <Card
                  key={w.subCategory}
                  onPress={() =>
                    go(`&filter=${encodeURIComponent(w.category)}`)
                  }
                  style={{
                    flexDirection: rtl.flexDirection,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <T weight="bold" color={palette.danger}>
                    {w.accuracy}%
                  </T>
                  <T weight="medium" style={{ flex: 1, marginHorizontal: 10 }}>
                    {w.subCategory}
                  </T>
                  <ChevronLeft color="#C7CBD4" size={18} />
                </Card>
              ))}
            </View>
          ) : null}

          {/* לפי נושא */}
          <T weight="bold" size={15} style={{ marginTop: 4 }}>
            לפי נושא
          </T>
          {categories.map((cat) => {
            const acc = accuracyByCat[cat.category];
            return (
              <Card
                key={cat.category}
                onPress={() =>
                  go(`&filter=${encodeURIComponent(cat.category)}`)
                }
                style={{ gap: 8 }}
              >
                <View
                  style={{
                    flexDirection: rtl.flexDirection,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View
                    style={{
                      flexDirection: rtl.flexDirection,
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <T size={20}>{CAT_ICON[cat.category] ?? '•'}</T>
                    <T weight="bold" size={16}>
                      {cat.category}
                    </T>
                  </View>
                  <T color={palette.muted} size={13}>
                    {cat.count} שאלות
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
                    <T color={palette.muted} size={12}>
                      דיוק {acc}%
                    </T>
                  </>
                ) : (
                  <T color={palette.muted} size={12}>
                    עוד לא תרגלת בנושא הזה
                  </T>
                )}
              </Card>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}
