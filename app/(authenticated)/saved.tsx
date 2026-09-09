import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, View } from 'react-native';
import { Button, Card, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';

export default function SavedScreen() {
  const router = useRouter();
  const list = useQuery(api.saved.list);

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="שאלות" highlight="שמורות" backLabel="בית" />
      {list === undefined ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : list.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <T center color={palette.muted}>
            עוד לא שמרת שאלות. במהלך תרגול, לחץ על הסימנייה כדי לשמור שאלה
            לשינון.
          </T>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 12 }}
        >
          <Card>
            <T weight="bold" size={16}>
              {list.length} שאלות שמורות
            </T>
            <View style={{ height: 10 }} />
            <Button
              label="תרגל את השאלות השמורות"
              onPress={() => router.push('/(authenticated)/quiz?mode=saved')}
            />
          </Card>
          {list.map((q) => (
            <Card key={q._id}>
              {q.imageUrl ? (
                <Image
                  source={{ uri: q.imageUrl }}
                  style={{
                    width: '100%',
                    height: 140,
                    borderRadius: 10,
                    marginBottom: 8,
                    backgroundColor: '#fff',
                  }}
                  resizeMode="contain"
                />
              ) : null}
              <T weight="medium" style={{ marginBottom: 6 }}>
                {q.text}
              </T>
              <T color={palette.success} size={14}>
                ✓ {q.answers[q.correctAnswer]}
              </T>
              {q.explanation ? (
                <T color="#4B3FA8" size={13} style={{ marginTop: 6 }}>
                  {q.explanation}
                </T>
              ) : null}
            </Card>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
