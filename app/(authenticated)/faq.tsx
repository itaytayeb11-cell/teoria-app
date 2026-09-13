import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Screen, ScreenHeader, T } from '@/components/ui';
import { palette } from '@/constants/Colors';
import { rtl } from '@/lib/rtl';

// שאלות נפוצות על האפליקציה עצמה בלבד (איך היא עובדת) — לא על חוקי התנועה,
// כדי לא להציג פרשנות משפטית שאינה מהמקור הרשמי
const FAQ: { q: string; a: string }[] = [
  {
    q: 'מאיפה השאלות באפליקציה?',
    a: 'השאלות מיובאות ממאגר השאלות הרשמי של משרד התחבורה שמפורסם ב-data.gov.il. לא כתבנו שאלות בעצמנו.',
  },
  {
    q: 'איך עובד המבחן המדמה?',
    a: '30 שאלות אקראיות ו-40 דקות, כמו במבחן האמיתי. עד 4 שגיאות נחשב "עברת".',
  },
  {
    q: 'מה ההבדל בין תרגול למבחן מדמה?',
    a: 'בתרגול מקבלים משוב והסבר מיד אחרי כל שאלה. במבחן מדמה רואים את התוצאה רק בסוף, ואפשר לשנות תשובות עד הסיום.',
  },
  {
    q: 'איך עובד הרצף (היהלומים)?',
    a: 'כל יום שבו סיימת מבחן או תרגול שלם מוסיף יהלום לרצף. יום שלא תרגלת בו מאפס את הרצף.',
  },
  {
    q: 'מה נכנס למחסן הטעויות?',
    a: 'כל שאלה שענית עליה לא נכון נשמרת שם עד שתענה עליה נכון, או עד שתסמן "ידעתי".',
  },
  {
    q: 'אפשר להחליף סוג רישיון?',
    a: 'כן — דרך התפריט, "עריכת פרופיל". השאלות מסוננות לפי סוג הרישיון שבחרת.',
  },
  {
    q: 'איך מחושב הניקוד בטבלת הדירוג?',
    a: 'משילוב של דיוק התשובות שלך, אחוז ההצלחה במבחני המדמה, וכמות התרגול. הדירוג מציג שמות בלבד.',
  },
  {
    q: 'איך מוחקים את החשבון?',
    a: 'בתפריט, "מחיקת חשבון". הפעולה מוחקת לצמיתות את כל הנתונים ואי אפשר לשחזר.',
  },
];

export default function FaqScreen() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <Screen edges={[]}>
      <ScreenHeader title="שאלות" highlight="נפוצות" />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 10 }}
      >
        {FAQ.map((item, i) => {
          const isOpen = open === i;
          return (
            <Card key={item.q} onPress={() => setOpen(isOpen ? null : i)}>
              <View
                style={{
                  flexDirection: rtl.flexDirection,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <T weight="bold" size={15} style={{ flex: 1 }}>
                  {item.q}
                </T>
                <T color={palette.primary} weight="bold" size={16}>
                  {isOpen ? '−' : '+'}
                </T>
              </View>
              {isOpen ? (
                <T
                  color={palette.muted}
                  size={14}
                  style={{ marginTop: 10, lineHeight: 21 }}
                >
                  {item.a}
                </T>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
