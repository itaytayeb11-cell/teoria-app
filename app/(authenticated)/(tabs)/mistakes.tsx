import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { CheckCheck, ChevronDown, Target, Zap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import {
  Button,
  Card,
  ProgressBar,
  Screen,
  ScreenHeader,
  T,
} from '@/components/ui';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

function tagFor(accuracy: number): { label: string; color: string } {
  if (accuracy < 60) {
    return { label: 'דורש תרגול', color: palette.danger };
  }
  if (accuracy < 75) {
    return { label: 'לשיפור', color: palette.warning };
  }
  if (accuracy < 90) {
    return { label: 'כמעט שם', color: palette.primarySoft };
  }
  return { label: 'שליטה טובה', color: palette.success };
}

export default function MistakesScreen() {
  const router = useRouter();
  const list = useQuery(api.mistakes.list);
  const stats = useQuery(api.stats.getMyStats);
  const dismiss = useMutation(api.mistakes.dismiss);
  const dismissAll = useMutation(api.mistakes.dismissAll);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const accuracyBySub = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of stats?.subCategoryBreakdown ?? []) {
      map[c.subCategory] = c.accuracy;
    }
    return map;
  }, [stats]);

  const bySubCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of list ?? []) {
      const key = q.subCategory ?? q.category;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([sub, mistakeCount]) => ({
        sub,
        mistakeCount,
        accuracy: accuracyBySub[sub] ?? 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [list, accuracyBySub]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <Screen edges={[]}>
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
            gap: 8,
          }}
        >
          <T size={40}>🎉</T>
          <T center weight="bold" size={17}>
            אין טעויות לתקן
          </T>
          <T center color={palette.muted}>
            שאלות שתטעה בהן יופיעו כאן, עם ניתוח לפי נושא.
          </T>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 14 }}
        >
          {/* כותרת + CTA */}
          <View
            style={{
              backgroundColor: palette.primaryDark,
              borderRadius: 18,
              padding: 18,
              gap: 4,
            }}
          >
            <T color="#fff" weight="bold" size={20}>
              🎯 מחסן הטעויות שלך
            </T>
            <T
              color="rgba(255,255,255,0.85)"
              size={13}
              style={{ marginBottom: 10 }}
            >
              {list.length} שאלות שהכשילו אותך. תרגול ממוקד כאן מחזק בדיוק את
              הנקודות שבהן אתה מתקשה.
            </T>
            <Pressable
              onPress={() => router.push('/(authenticated)/quiz?mode=mistakes')}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                height: 50,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: rtl.flexDirection,
                gap: 8,
              }}
            >
              <Zap color={palette.primary} size={18} fill={palette.primary} />
              <T color={palette.primary} weight="bold">
                הפעל מרתון תיקון טעויות ({list.length} שאלות)
              </T>
            </Pressable>
            <T
              color="rgba(255,255,255,0.75)"
              size={12}
              center
              style={{ marginTop: 6 }}
            >
              ⏱ זמן משוער: {Math.max(1, Math.round(list.length * 0.6))} דק'
            </T>
          </View>

          {/* ניתוח לפי נושאים */}
          {bySubCategory.length > 0 ? (
            <Card style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: rtl.flexDirection,
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Target color={palette.primary} size={16} />
                <T weight="bold" size={15}>
                  ניתוח לפי נושאים
                </T>
              </View>
              {bySubCategory.map((s) => {
                const tag = tagFor(s.accuracy);
                return (
                  <View key={s.sub} style={{ gap: 6 }}>
                    <View
                      style={{
                        flexDirection: rtl.flexDirection,
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: `${tag.color}22`,
                          borderRadius: 999,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                        }}
                      >
                        <T size={11} weight="bold" color={tag.color}>
                          {tag.label}
                        </T>
                      </View>
                      <T
                        weight="medium"
                        style={{ flex: 1, marginHorizontal: 10 }}
                      >
                        {s.sub}
                      </T>
                      <T size={12} color={palette.muted}>
                        {s.mistakeCount} טעויות
                      </T>
                    </View>
                    <ProgressBar
                      value={s.accuracy / 100}
                      track="#EDEFF4"
                      fill={tag.color}
                    />
                  </View>
                );
              })}
            </Card>
          ) : null}

          {/* רשימת שאלות */}
          <T weight="bold" size={15}>
            שאלות שמכשילות אותך
          </T>
          {list.map((q) => {
            const isOpen = expanded.has(q._id);
            return (
              <Card key={q._id} style={{ gap: 10 }}>
                <Pressable
                  onPress={() => toggle(q._id)}
                  style={{
                    flexDirection: rtl.flexDirection,
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <View style={{ flex: 1, gap: 6 }}>
                    <View
                      style={{
                        flexDirection: rtl.flexDirection,
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      {q.wrongCount >= 2 ? (
                        <View
                          style={{
                            backgroundColor: palette.dangerBg,
                            borderRadius: 999,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                          }}
                        >
                          <T size={11} weight="bold" color={palette.danger}>
                            טעות חוזרת ×{q.wrongCount}
                          </T>
                        </View>
                      ) : null}
                      <T size={12} color={palette.muted}>
                        {q.subCategory ?? q.category}
                      </T>
                    </View>
                    <T weight="medium">{q.text}</T>
                  </View>
                  <ChevronDown
                    color="#9AA3B2"
                    size={18}
                    style={{
                      transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
                    }}
                  />
                </Pressable>

                {isOpen ? (
                  <View style={{ gap: 8 }}>
                    {q.imageUrl ? (
                      <Image
                        source={{ uri: q.imageUrl }}
                        style={{
                          width: '100%',
                          height: 120,
                          borderRadius: 10,
                          backgroundColor: '#F4F5F7',
                        }}
                        resizeMode="contain"
                      />
                    ) : null}
                    <View style={{ flexDirection: rtl.flexDirection, gap: 8 }}>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: palette.successBg,
                          borderRadius: 10,
                          padding: 10,
                        }}
                      >
                        <T size={11} color={palette.success} weight="bold">
                          תשובה נכונה
                        </T>
                        <T size={13} style={{ marginTop: 2 }}>
                          {q.answers[q.correctAnswer]}
                        </T>
                      </View>
                      {q.lastSelected !== undefined && q.lastSelected >= 0 ? (
                        <View
                          style={{
                            flex: 1,
                            backgroundColor: palette.dangerBg,
                            borderRadius: 10,
                            padding: 10,
                          }}
                        >
                          <T size={11} color={palette.danger} weight="bold">
                            התשובה שלך
                          </T>
                          <T size={13} style={{ marginTop: 2 }}>
                            {q.answers[q.lastSelected]}
                          </T>
                        </View>
                      ) : null}
                    </View>
                    {q.explanation ? (
                      <T
                        color="#4B3FA8"
                        size={13}
                        style={{ textAlign: rtl.textAlign }}
                      >
                        {q.explanation}
                      </T>
                    ) : null}
                    <Pressable
                      onPress={() =>
                        dismiss({ questionId: q._id }).catch(() => {
                          // סימון "ידעתי" נכשל — אפשר לנסות שוב, לא קריטי
                        })
                      }
                      style={{
                        flexDirection: rtl.flexDirection,
                        alignItems: 'center',
                        gap: 6,
                        alignSelf:
                          rtl.textAlign === 'right' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <CheckCheck color={palette.success} size={16} />
                      <T size={12} color={palette.success} weight="medium">
                        כבר יודע — הוצא מהמחסן
                      </T>
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            );
          })}

          {/* ניקוי מהמחסן */}
          <Card style={{ alignItems: 'center', gap: 10 }}>
            <T size={28}>✅</T>
            <T weight="bold" center>
              מרגיש בטוח בחומר?
            </T>
            <T color={palette.muted} size={13} center>
              סמן את כל השאלות כ"ידעתי" כדי לשמור על מחסן ממוקד. שאלה שתטעה בה
              שוב תחזור אליו אוטומטית.
            </T>
            <Button
              label="סמן הכל כ'ידעתי' ונקה את המחסן"
              variant="outline"
              onPress={() =>
                dismissAll().catch(() =>
                  Alert.alert(
                    'שגיאה',
                    'לא הצלחנו לנקות את המחסן. בדוק את החיבור ונסה שוב.'
                  )
                )
              }
            />
          </Card>
        </ScrollView>
      )}
    </Screen>
  );
}
