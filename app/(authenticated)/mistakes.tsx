import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, View } from 'react-native';
import { Button, Card, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';

export default function MistakesScreen() {
  const router = useRouter();
  const list = useQuery(api.mistakes.list);

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="מחסן" highlight="הטעויות" hideBack />
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
            אין טעויות לתקן — כל הכבוד! שאלות שתטעה בהן יופיעו כאן לחיזוק.
          </T>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 12 }}
        >
          <Card>
            <T weight="bold" size={16}>
              {list.length} שאלות לחיזוק
            </T>
            <T color={palette.muted} size={13} style={{ marginVertical: 8 }}>
              אלה השאלות שבהן טעית לאחרונה. תרגל אותן שוב עד שתענה נכון.
            </T>
            <Button
              label="תרגל את כל הטעויות"
              onPress={() => router.push('/(authenticated)/quiz?mode=mistakes')}
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
