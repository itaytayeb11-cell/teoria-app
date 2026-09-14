import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { Bookmark, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Button,
  Card,
  RingProgress,
  Screen,
  ScreenHeader,
  T,
} from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

type SignItem = {
  id: string;
  url: string;
  text: string;
  answer: string;
  category: string;
  officialId?: string;
};

export default function SignsScreen() {
  const router = useRouter();
  const data = useQuery(api.questions.signDictionary);
  const progress = useQuery(api.questions.signProgress);
  const savedIds = useQuery(api.saved.listIds);
  const toggleSave = useMutation(api.saved.toggle);

  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [zoomed, setZoomed] = useState<SignItem | null>(null);

  const groups = useMemo(() => data ?? [], [data]);
  const active = groups[tab];

  const visibleItems = useMemo(() => {
    if (!active) {
      return [];
    }
    const q = search.trim();
    if (!q) {
      return active.items;
    }
    return active.items.filter(
      (item) =>
        item.text.includes(q) ||
        item.answer.includes(q) ||
        item.officialId === q
    );
  }, [active, search]);

  const savedSet = useMemo(
    () => new Set((savedIds ?? []).map(String)),
    [savedIds]
  );

  return (
    <Screen edges={[]}>
      <ScreenHeader title="לוח" highlight="תמרורים" hideBack />

      {data === undefined ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <>
          <View style={{ padding: 12, gap: 12 }}>
            {/* חיפוש */}
            <View
              style={{
                flexDirection: rtl.flexDirection,
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#fff',
                borderRadius: 12,
                paddingHorizontal: 12,
                height: 46,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              <Search color={palette.muted} size={18} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="חפש תמרור לפי מילה או נוסח..."
                placeholderTextColor="#9CA3AF"
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: '#25324D',
                  textAlign: rtl.textAlign,
                  writingDirection: 'rtl',
                }}
              />
            </View>

            {/* התקדמות */}
            {progress ? (
              <Card
                style={{
                  flexDirection: rtl.flexDirection,
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <RingProgress
                  value={
                    progress.total ? (progress.seen / progress.total) * 100 : 0
                  }
                  size={64}
                  strokeWidth={7}
                />
                <View style={{ flex: 1 }}>
                  <T weight="bold" size={15}>
                    התקדמות במילון
                  </T>
                  <T color={palette.muted} size={13}>
                    {progress.seen} מתוך {progress.total} תמרורים נצפו בתרגול
                  </T>
                </View>
              </Card>
            ) : null}
          </View>

          {/* בורר תת-נושא */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 12,
              gap: 8,
              alignItems: 'center',
            }}
            style={{ flexGrow: 0, height: 56 }}
          >
            {groups.map((g, i) => (
              <Pressable
                key={g.group}
                onPress={() => setTab(i)}
                style={{
                  minHeight: 36,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: i === tab ? palette.primary : '#EAECF2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 13,
                    fontWeight: i === tab ? '700' : '400',
                    color: i === tab ? '#fff' : palette.muted,
                  }}
                >
                  {`${g.group} (${g.items.length})`}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView
            contentContainerStyle={{ padding: 12, paddingBottom: 12, gap: 10 }}
            keyboardShouldPersistTaps="handled"
          >
            {visibleItems.map((item) => (
              <Card
                key={item.id}
                onPress={() => setZoomed(item)}
                style={{ flexDirection: rtl.flexDirection, gap: 12 }}
              >
                <Image
                  source={{ uri: item.url }}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 10,
                    backgroundColor: '#F4F5F7',
                  }}
                  resizeMode="contain"
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <T weight="bold" size={14} numberOfLines={2}>
                    {item.answer}
                  </T>
                  <T color={palette.muted} size={12} numberOfLines={2}>
                    {item.text}
                  </T>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    toggleSave({ questionId: item.id as never }).catch(() => {
                      // שמירת סימנייה נכשלה — לא קריטי, המשתמש יכול לנסות שוב
                    })
                  }
                >
                  <Bookmark
                    color={palette.primary}
                    size={20}
                    fill={
                      savedSet.has(item.id) ? palette.primary : 'transparent'
                    }
                  />
                </Pressable>
              </Card>
            ))}
            {visibleItems.length === 0 ? (
              <T center color={palette.muted} style={{ marginTop: 20 }}>
                לא נמצאו תמרורים תואמים
              </T>
            ) : null}
          </ScrollView>

          {/* מבחן תמרורים מהיר */}
          <View style={{ padding: 16 }}>
            <Button
              label="התחל מבחן תמרורים מהיר (10 שאלות)"
              onPress={() =>
                router.push(
                  '/(authenticated)/quiz?mode=practice&filter=תמרורים&count=10'
                )
              }
            />
          </View>
        </>
      )}

      <Modal
        visible={zoomed !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomed(null)}
      >
        <Pressable
          onPress={() => setZoomed(null)}
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
            {zoomed ? (
              <>
                <Image
                  source={{ uri: zoomed.url }}
                  style={{ width: '100%', height: 180, marginBottom: 12 }}
                  resizeMode="contain"
                />
                <T
                  color={palette.muted}
                  size={12}
                  weight="medium"
                  style={{ textAlign: rtl.textAlign, marginBottom: 4 }}
                >
                  פירוש התמרור
                </T>
                <T
                  weight="bold"
                  size={16}
                  color={palette.primary}
                  style={{ textAlign: rtl.textAlign, marginBottom: 12 }}
                >
                  {zoomed.answer}
                </T>
                <T
                  color={palette.muted}
                  size={13}
                  style={{ textAlign: rtl.textAlign }}
                >
                  {zoomed.text}
                </T>
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}
