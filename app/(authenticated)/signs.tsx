import { useQuery } from 'convex/react';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Card, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

export default function SignsScreen() {
  const data = useQuery(api.questions.signDictionary);
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState<{
    url: string;
    text: string;
  } | null>(null);

  const groups = useMemo(() => data ?? [], [data]);
  const active = groups[tab];

  return (
    <Screen edges={['top']}>
      <ScreenHeader title="לוח" highlight="תמרורים" hideBack />

      {data === undefined ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <>
          {/* בורר תת-נושא */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ padding: 12, gap: 8 }}
          >
            {groups.map((g, i) => (
              <Pressable
                key={g.group}
                onPress={() => setTab(i)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: i === tab ? palette.primary : '#EAECF2',
                }}
              >
                <T
                  size={13}
                  weight={i === tab ? 'bold' : 'regular'}
                  color={i === tab ? '#fff' : palette.muted}
                >
                  {g.group} ({g.items.length})
                </T>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={{ padding: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
                justifyContent: 'space-between',
              }}
            >
              {active?.items.map((item) => (
                <Pressable
                  key={item.url}
                  onPress={() => setSelected(item)}
                  style={{ width: '31%' }}
                >
                  <Card style={{ padding: 8, alignItems: 'center' }}>
                    <Image
                      source={{ uri: item.url }}
                      style={{ width: '100%', height: 80 }}
                      resizeMode="contain"
                    />
                  </Card>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable
          onPress={() => setSelected(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15,20,32,0.6)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 18,
              padding: 18,
              width: '100%',
            }}
          >
            {selected ? (
              <>
                <Image
                  source={{ uri: selected.url }}
                  style={{ width: '100%', height: 180, marginBottom: 12 }}
                  resizeMode="contain"
                />
                <T weight="medium" style={{ textAlign: rtl.textAlign }}>
                  {selected.text}
                </T>
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}
