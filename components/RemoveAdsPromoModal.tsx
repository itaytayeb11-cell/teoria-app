// ============================================================================
// פופ-אפ פרסום "הסרת פרסומות" — לא פרסומת AdMob, חלון משלנו שמזכיר
// למשתמש שיש אופציה לרכישה חד-פעמית שמסירה פרסומות. מוצג פעם ב-יומיים
// (ר' hooks/useRemoveAdsPromo).
// ============================================================================
import { useRouter } from 'expo-router';
import { Ban } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';
import { Button, T } from '@/components/ui';
import { palette } from '@/constants/Colors';

export function RemoveAdsPromoModal(props: {
  visible: boolean;
  onDismiss: () => void;
}) {
  const router = useRouter();

  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      onRequestClose={props.onDismiss}
    >
      <Pressable
        onPress={props.onDismiss}
        style={{
          flex: 1,
          backgroundColor: 'rgba(15,20,32,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#fff',
            borderRadius: 22,
            padding: 22,
            width: '100%',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: palette.primaryTint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ban color={palette.primary} size={28} />
          </View>
          <T weight="bold" size={18} center>
            רוצה לתרגל בלי הפרעות?
          </T>
          <T color={palette.muted} size={14} center style={{ lineHeight: 20 }}>
            רכישה חד-פעמית מסירה את כל הפרסומות מהאפליקציה — לתמיד, בלי תשלום
            חוזר.
          </T>
          <View style={{ width: '100%', gap: 8, marginTop: 6 }}>
            <Button
              label="הסר פרסומות"
              onPress={() => {
                props.onDismiss();
                router.push('/(authenticated)/remove-ads');
              }}
            />
            <Button
              label="אולי מאוחר יותר"
              variant="outline"
              onPress={props.onDismiss}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
