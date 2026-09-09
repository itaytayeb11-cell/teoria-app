import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ============================================================================
// מסך הגדרה ידידותי (Setup Screen)
// ============================================================================
// מוצג כאשר עדיין לא הוגדר Backend של Convex (אין EXPO_PUBLIC_CONVEX_URL).
// במקום שהאפליקציה תקרוס, התלמיד רואה הוראות ברורות מה לעשות.
//
// Shown when no Convex backend is configured yet. Instead of crashing, the
// student sees clear, friendly instructions on how to get started.

// צעד בודד ברשימת ההוראות
function Step({
  number,
  command,
  hebrew,
  english,
}: {
  number: number;
  command: string;
  hebrew: string;
  english: string;
}) {
  return (
    <View className="mb-5 flex-row">
      {/* מספר הצעד בעיגול */}
      <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-blue-600">
        <Text className="font-bold text-base text-white">{number}</Text>
      </View>

      <View className="flex-1">
        <Text className="mb-1 text-right text-base text-zinc-200">
          {hebrew}
        </Text>
        <Text className="mb-2 text-left text-sm text-zinc-400">{english}</Text>

        {/* פקודת הטרמינל */}
        <View className="rounded-lg bg-zinc-800 px-3 py-2">
          <Text className="font-mono text-green-400 text-sm">{command}</Text>
        </View>
      </View>
    </View>
  );
}

export function SetupScreen() {
  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-10"
        showsVerticalScrollIndicator={false}
      >
        {/* כותרת ראשית */}
        <Text className="mb-2 text-center font-bold text-3xl text-white">
          👋 כמעט מוכן!
        </Text>
        <Text className="mb-8 text-center text-base text-zinc-400">
          Almost ready! Just one quick setup step.
        </Text>

        {/* הסבר קצר */}
        <View className="mb-8 rounded-xl bg-zinc-900 p-4">
          <Text className="mb-2 text-right text-base text-zinc-200 leading-6">
            כדי להריץ את האפליקציה צריך להגדיר את ה-Backend (Convex). זה לוקח
            דקה אחת ונעשה אוטומטית — פשוט הריצו את הפקודות הבאות בטרמינל.
          </Text>
          <Text className="text-left text-sm text-zinc-400 leading-5">
            To run the app you need to set up the backend (Convex). It takes one
            minute and is automatic — just run these commands in the terminal.
          </Text>
        </View>

        {/* רשימת הצעדים */}
        <Step
          command="bunx convex dev"
          english="Run this and log in via the browser. It creates your own backend and saves your keys automatically. Leave it running."
          hebrew="הריצו את הפקודה והתחברו דרך הדפדפן. היא יוצרת לכם Backend אישי ושומרת את המפתחות אוטומטית. השאירו אותה פועלת."
          number={1}
        />
        <Step
          command="bun dev"
          english="In a second terminal, start the app. It will connect to your new backend."
          hebrew="בטרמינל שני, הפעילו את האפליקציה. היא תתחבר ל-Backend החדש שלכם."
          number={2}
        />

        {/* הערת סיום */}
        <View className="mt-4 rounded-xl border border-zinc-800 p-4">
          <Text className="text-right text-sm text-zinc-400 leading-5">
            אחרי שהפקודות רצות, האפליקציה תיטען מחדש לבד ותציג את מסך ההתחברות.
          </Text>
          <Text className="mt-1 text-left text-xs text-zinc-500 leading-4">
            Once the commands are running, the app reloads automatically and
            shows the sign-in screen.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
