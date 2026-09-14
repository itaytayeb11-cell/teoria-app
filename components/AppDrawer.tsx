// ============================================================================
// תפריט צד (Drawer) — נפתח בלחיצה על ההמבורגר, מחליק פנימה מימין לשמאל.
// עיצוב Liquid Glass: פאנל מטושטש בגוון כחול שדרכו רואים את המסך שמאחוריו.
// ============================================================================
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  Ban,
  BarChart3,
  Bookmark,
  ChevronLeft,
  FileText,
  HelpCircle,
  History,
  ListChecks,
  LogOut,
  Mail,
  Search,
  Shield,
  TrafficCone,
  Trash2,
  UserCog,
  UserPlus,
  X,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '@/components/ui';
import { WebViewModal } from '@/components/WebViewModal';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/config/legalUrls';
import { SUPPORT_EMAIL } from '@/config/support';
import { palette } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';
import { rtl } from '@/lib/rtl';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = Math.min(SCREEN_WIDTH * 0.86, 380);

type QuickAction = {
  label: string;
  icon: ComponentType<{ color?: string; size?: number }>;
  path: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'תרגול', icon: ListChecks, path: '/(authenticated)/practice' },
  { label: 'תמרורים', icon: TrafficCone, path: '/(authenticated)/signs' },
  {
    label: 'מחסן טעויות',
    icon: AlertCircle,
    path: '/(authenticated)/mistakes',
  },
  { label: 'סטטיסטיקה', icon: BarChart3, path: '/(authenticated)/stats' },
];

export function AppDrawer(props: { visible: boolean; onClose: () => void }) {
  const { visible, onClose } = props;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getCurrentUser);
  const deleteMyAccount = useMutation(api.users.deleteMyAccount);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [webTitle, setWebTitle] = useState('');
  const [search, setSearch] = useState('');
  // מוצג כל עוד האנימציה רצה — כדי שההחלקה החוצה תיראה לפני שה-Modal נעלם
  const [mounted, setMounted] = useState(visible);
  const slide = useRef(new Animated.Value(PANEL_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(slide, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(slide, {
      toValue: PANEL_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [visible, slide]);

  const go = (path: string) => {
    onClose();
    router.push(path as never);
  };

  const openWeb = (url: string, title: string) => {
    setWebTitle(title);
    setWebUrl(url);
  };

  const inviteFriends = async () => {
    try {
      await Share.share({
        message:
          'אני מתכונן למבחן התיאוריה עם האפליקציה "תיאוריה" — שאלות מהמאגר הרשמי ומבחני מדמה. בוא נתחרה מי מגיע מוכן יותר 🚗',
      });
    } catch {
      // המשתמש ביטל את השיתוף — אין מה לעשות
    }
  };

  const contact = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('פנייה מאפליקציית תיאוריה')}`;
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
    } else {
      Alert.alert('צור קשר', `אפשר לכתוב לנו למייל: ${SUPPORT_EMAIL}`);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('התנתקות', 'להתנתק מהחשבון?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'התנתק',
        style: 'destructive',
        onPress: () => {
          onClose();
          signOut();
        },
      },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'מחיקת חשבון',
      'פעולה זו תמחק לצמיתות את החשבון וכל הנתונים (מבחנים, היסטוריה, התקדמות). לא ניתן לשחזר.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק חשבון',
          style: 'destructive',
          onPress: () => {
            Alert.alert('אישור סופי', 'למחוק את החשבון לצמיתות?', [
              { text: 'ביטול', style: 'cancel' },
              {
                text: 'כן, מחק',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteMyAccount();
                    onClose();
                    await signOut();
                  } catch {
                    Alert.alert('שגיאה', 'מחיקת החשבון נכשלה. נסה שוב.');
                  }
                },
              },
            ]);
          },
        },
      ]
    );
  };

  type Row = {
    label: string;
    icon: ComponentType<{ color?: string; size?: number }>;
    onPress: () => void;
    danger?: boolean;
  };

  const rows: Row[] = [
    {
      label: 'עריכת פרופיל',
      icon: UserCog,
      onPress: () => go('/(authenticated)/license'),
    },
    {
      label: 'היסטוריית מבחנים',
      icon: History,
      onPress: () => go('/(authenticated)/history'),
    },
    {
      label: 'שאלות שמורות',
      icon: Bookmark,
      onPress: () => go('/(authenticated)/saved'),
    },
    {
      label: 'שאלות נפוצות',
      icon: HelpCircle,
      onPress: () => go('/(authenticated)/faq'),
    },
    {
      label: 'הסרת פרסומות',
      icon: Ban,
      onPress: () => go('/(authenticated)/remove-ads'),
    },
    { label: 'צור קשר', icon: Mail, onPress: contact },
    {
      label: 'תנאי שימוש',
      icon: FileText,
      onPress: () => openWeb(TERMS_OF_SERVICE_URL, 'תנאי שימוש'),
    },
    {
      label: 'מדיניות פרטיות',
      icon: Shield,
      onPress: () => openWeb(PRIVACY_POLICY_URL, 'מדיניות פרטיות'),
    },
    { label: 'התנתק', icon: LogOut, onPress: confirmSignOut, danger: true },
    {
      label: 'מחיקת חשבון',
      icon: Trash2,
      onPress: confirmDelete,
      danger: true,
    },
  ];

  const q = search.trim();
  const visibleRows = q ? rows.filter((r) => r.label.includes(q)) : rows;
  const showQuick = !q;

  const name = user?.fullName?.trim() || 'תלמיד';

  return (
    <>
      <Modal
        visible={mounted}
        transparent
        animationType="none"
        onRequestClose={onClose}
      >
        {/* רקע כהה — לחיצה עליו סוגרת */}
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(10,18,38,0.45)' },
          ]}
          onPress={onClose}
        />
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: PANEL_WIDTH,
            transform: [{ translateX: slide }],
            overflow: 'hidden',
            borderTopLeftRadius: 28,
            borderBottomLeftRadius: 28,
          }}
        >
          <BlurView
            intensity={60}
            tint="light"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(224,235,255,0.82)' },
            ]}
          />
          <ScrollView
            contentContainerStyle={{
              paddingTop: insets.top + 16,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
              paddingHorizontal: 16,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* כותרת + סגירה */}
            <View
              style={{
                flexDirection: rtl.flexDirection,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <T weight="bold" size={22}>
                  שלום, {name}
                </T>
                <T color={palette.muted} size={13}>
                  תיאוריה
                </T>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: 'rgba(29,78,216,0.10)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X color={palette.primary} size={20} />
              </Pressable>
            </View>

            {/* חיפוש בתפריט */}
            <View
              style={{
                flexDirection: rtl.flexDirection,
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: 999,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: 'rgba(29,78,216,0.18)',
                paddingHorizontal: 14,
                height: 46,
                marginTop: 16,
              }}
            >
              <Search color={palette.muted} size={18} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="מה לחפש?"
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

            {/* קיצורי דרך עגולים */}
            {showQuick ? (
              <View
                style={{
                  flexDirection: rtl.flexDirection,
                  justifyContent: 'space-between',
                  marginTop: 20,
                }}
              >
                {QUICK_ACTIONS.map((a) => (
                  <Pressable
                    key={a.path}
                    onPress={() => go(a.path)}
                    style={{ alignItems: 'center', width: 72, gap: 6 }}
                  >
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: palette.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <a.icon color="#fff" size={24} />
                    </View>
                    <T size={11} center color={palette.muted}>
                      {a.label}
                    </T>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {/* חברים ואתגרים */}
            {showQuick ? (
              <>
                <T
                  color={palette.muted}
                  size={12}
                  weight="medium"
                  style={{ marginTop: 24, marginBottom: 8 }}
                >
                  חברים ואתגרים
                </T>
                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  <DrawerRow
                    label="טבלת הדירוג"
                    icon={BarChart3}
                    onPress={() => go('/(authenticated)/leaderboard')}
                  />
                  <DrawerRow
                    label="הזמן חברים לאתגר"
                    icon={UserPlus}
                    onPress={inviteFriends}
                    accent
                    last
                  />
                </View>
              </>
            ) : null}

            {/* שאר הפריטים */}
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.7)',
                borderRadius: 16,
                overflow: 'hidden',
                marginTop: 16,
              }}
            >
              {visibleRows.map((r, i) => (
                <DrawerRow
                  key={r.label}
                  label={r.label}
                  icon={r.icon}
                  onPress={r.onPress}
                  danger={r.danger}
                  last={i === visibleRows.length - 1}
                />
              ))}
              {visibleRows.length === 0 ? (
                <View style={{ padding: 16 }}>
                  <T color={palette.muted} size={13}>
                    לא נמצאו תוצאות
                  </T>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </Animated.View>
      </Modal>

      <WebViewModal
        visible={webUrl !== null}
        url={webUrl ?? ''}
        title={webTitle}
        onClose={() => setWebUrl(null)}
      />
    </>
  );
}

function DrawerRow(props: {
  label: string;
  icon: ComponentType<{ color?: string; size?: number }>;
  onPress: () => void;
  danger?: boolean;
  accent?: boolean;
  last?: boolean;
}) {
  const color = props.danger
    ? palette.danger
    : props.accent
      ? palette.primary
      : '#25324D';
  return (
    <Pressable
      onPress={props.onPress}
      style={{
        flexDirection: rtl.flexDirection,
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderBottomWidth: props.last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(29,78,216,0.12)',
      }}
    >
      <props.icon color={color} size={20} />
      <T style={{ flex: 1 }} weight="medium" size={15} color={color}>
        {props.label}
      </T>
      <ChevronLeft color="#B7BDC9" size={18} />
    </Pressable>
  );
}
