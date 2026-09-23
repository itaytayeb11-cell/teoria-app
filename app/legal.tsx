import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { tw } from '@/lib/rtl';

// מסך מסמכים משפטיים (תנאי שימוש / מדיניות פרטיות) — מסך מלא (push רגיל),
// לא Modal, כדי למנוע התנגשות בין שני Modal של RN שתקעה את המסך כשנפתח
// מתוך תפריט הצד (שגם הוא Modal)
export default function LegalScreen() {
  const router = useRouter();
  const { url, title } = useLocalSearchParams<{ url: string; title: string }>();

  return (
    <View className="flex-1 bg-[#0a0a0a]">
      <SafeAreaView className="flex-1 bg-[#0a0a0a]">
        <View
          className={`${tw.flexRow} items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3`}
        >
          <Text className="flex-1 text-white text-lg font-semibold">
            {title ?? 'מסמך'}
          </Text>
          <TouchableOpacity
            accessibilityLabel="סגור"
            accessibilityRole="button"
            accessible={true}
            onPress={() => router.back()}
          >
            <X color="#e5e7eb" size={24} />
          </TouchableOpacity>
        </View>
        <WebView className="flex-1" source={{ uri: url ?? '' }} />
      </SafeAreaView>
    </View>
  );
}
