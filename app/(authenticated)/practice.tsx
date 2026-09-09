import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Card, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

export default function PracticeScreen() {
  const router = useRouter();
  const categories = useQuery(api.questions.listCategories);
  const stats = useQuery(api.stats.getMyStats);

  const accuracyByCat: Record<string, number> = {};
  for (const c of stats?.categoryBreakdown ?? []) {
    accuracyByCat[c.category] = c.accuracy;
  }

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="תרגול" highlight="שאלות" />
      {categories === undefined ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <T color={palette.muted} size={13}>
            בחר נושא לתרגול. תקבל משוב מיידי והסבר לכל שאלה.
          </T>
          {categories.map((cat) => (
            <Card
              key={cat.category}
              onPress={() =>
                router.push(
                  `/(authenticated)/quiz?mode=practice&filter=${encodeURIComponent(cat.category)}`
                )
              }
              style={{
                flexDirection: rtl.flexDirection,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <ChevronLeft color="#C7CBD4" size={20} />
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <T weight="bold" size={17}>
                  {cat.category}
                </T>
                <T color={palette.muted} size={13}>
                  {cat.count} שאלות
                  {accuracyByCat[cat.category] !== undefined
                    ? ` · דיוק ${accuracyByCat[cat.category]}%`
                    : ''}
                </T>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
