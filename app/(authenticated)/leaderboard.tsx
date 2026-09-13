import { useQuery } from 'convex/react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { Card, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

type Row = { rank: number; name: string; score: number; isMe: boolean };

export default function LeaderboardScreen() {
  const data = useQuery(api.stats.getLeaderboard);

  return (
    <Screen edges={[]}>
      <ScreenHeader title="טבלת" highlight="דירוג" />
      {data === undefined ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <FlatList
          data={data.top}
          keyExtractor={(r) => String(r.rank)}
          contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 8 }}
          ListHeaderComponent={
            <T color={palette.muted} size={12} style={{ marginBottom: 8 }}>
              ניקוד מחושב מדיוק תשובות, אחוז הצלחה במבחני מדמה, וכמות תרגול
            </T>
          }
          ListFooterComponent={
            data.me && !data.top.some((r) => r.isMe) ? (
              <View style={{ marginTop: 10 }}>
                <T color={palette.muted} size={12} style={{ marginBottom: 8 }}>
                  המיקום שלך
                </T>
                <LeaderRow row={data.me} />
              </View>
            ) : null
          }
          renderItem={({ item }) => <LeaderRow row={item} />}
        />
      )}
    </Screen>
  );
}

function LeaderRow({ row }: { row: Row }) {
  const medal =
    row.rank === 1
      ? '🥇'
      : row.rank === 2
        ? '🥈'
        : row.rank === 3
          ? '🥉'
          : null;
  return (
    <Card
      style={{
        flexDirection: rtl.flexDirection,
        alignItems: 'center',
        gap: 12,
        borderWidth: row.isMe ? 1.5 : 0,
        borderColor: palette.primary,
        backgroundColor: row.isMe ? palette.primaryTint : undefined,
      }}
    >
      <View style={{ width: 30, alignItems: 'center' }}>
        {medal ? (
          <T size={20}>{medal}</T>
        ) : (
          <T weight="bold" color={palette.muted}>
            {row.rank}
          </T>
        )}
      </View>
      <T weight={row.isMe ? 'bold' : 'medium'} size={15} style={{ flex: 1 }}>
        {row.name}
        {row.isMe ? ' (אתה)' : ''}
      </T>
      <T weight="bold" color={palette.primary}>
        {row.score}
      </T>
    </Card>
  );
}
