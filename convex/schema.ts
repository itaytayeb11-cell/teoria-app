import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// הגדרת הסכמה (Schema) של מסד הנתונים
// קובץ זה מגדיר את מבנה הטבלאות והקשרים ב-Database
export default defineSchema({
  // יבוא טבלאות ברירת מחדל של ספריית האימות (users, sessions, etc.)
  ...authTables,

  // טבלת משתמשים מורחבת
  // מכילה מידע נוסף על המשתמשים מעבר לבסיס של ספריית האימות
  users: defineTable({
    email: v.string(), // כתובת אימייל
    emailVerified: v.optional(v.boolean()), // האם האימייל אומת
    fullName: v.optional(v.string()), // שם מלא
    role: v.union(v.literal('admin'), v.literal('user')), // תפקיד המשתמש (מנהל או משתמש רגיל)
    userType: v.optional(v.union(v.literal('free'), v.literal('paid'))), // סוג משתמש (חינמי או בתשלום) - אופציונלי לתאימות לאחור
    licenseType: v.optional(v.string()), // סוג הרישיון שנבחר: "B" (פרטי), "A" (אופנוע), "C1", "C", "D", "1" (טרקטור)
    isActive: v.boolean(), // האם המשתמש פעיל
    createdAt: v.number(), // זמן יצירה (Timestamp)
    updatedAt: v.number(), // זמן עדכון אחרון (Timestamp)
  })
    .index('by_email', ['email']) // אינדקס לחיפוש מהיר לפי אימייל
    .index('by_role', ['role']) // אינדקס לסינון מהיר לפי תפקיד
    .index('by_userType', ['userType']), // אינדקס לסינון מהיר לפי סוג משתמש

  // ==========================================================================
  // טבלת שאלות — מאגר שאלות התאוריה
  // ==========================================================================
  questions: defineTable({
    text: v.string(), // נוסח השאלה
    answers: v.array(v.string()), // מערך של 4 תשובות אפשריות
    correctAnswer: v.number(), // אינדקס התשובה הנכונה (0-3)
    explanation: v.optional(v.string()), // הסבר לתשובה הנכונה (מוצג אחרי מענה)
    category: v.string(), // נושא ראשי: "תמרורים", "חוקי התנועה", "בטיחות", "הכרת הרכב"
    subCategory: v.optional(v.string()), // תת-נושא לניתוח חולשות (למשל "זכות קדימה", "סימון על הכביש")
    difficulty: v.number(), // דרגת קושי 1-5
    imageUrl: v.optional(v.string()), // כתובת תמונה חיצונית (תמרור/מצב תנועה) ממאגר משרד התחבורה
    imageStorageId: v.optional(v.id('_storage')), // תמונה מאוחסנת ב-Convex (עתידי, במקום imageUrl)
    licenseTypes: v.optional(v.array(v.string())), // סוגי רישיון רלוונטיים: "B", "A", "C", "D" וכו'
    officialId: v.optional(v.string()), // מזהה מקורי ממאגר משרד התחבורה (למניעת כפילויות)
    isActive: v.boolean(), // האם השאלה פעילה (מוצגת למשתמשים)
  })
    .index('by_category', ['category'])
    .index('by_difficulty', ['difficulty'])
    .index('by_officialId', ['officialId'])
    .index('by_active', ['isActive']),

  // ==========================================================================
  // טבלת מבחנים — כל מבחן שמשתמש התחיל/סיים
  // ==========================================================================
  quizSessions: defineTable({
    userId: v.id('users'),
    mode: v.union(
      v.literal('category'), // מבחן לפי נושא
      v.literal('difficulty'), // מבחן לפי דרגת קושי
      v.literal('simulation'), // מבחן מדמה (30 שאלות אקראיות)
      v.literal('all') // מכל המאגר
    ),
    filterValue: v.optional(v.string()), // הערך שסונן לפיו (שם נושא / דרגת קושי כמחרוזת)
    questionIds: v.array(v.id('questions')), // רשימת השאלות במבחן, לפי הסדר
    answers: v.array(
      v.object({
        questionId: v.id('questions'),
        selected: v.number(), // מה המשתמש בחר (0-3), -1 אם דילג
        isCorrect: v.boolean(),
      })
    ),
    totalQuestions: v.number(),
    correctCount: v.number(),
    incorrectCount: v.number(),
    scorePercent: v.number(), // ציון באחוזים 0-100
    status: v.union(v.literal('in_progress'), v.literal('completed')),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status']),

  // ==========================================================================
  // יומן תשובות — שורה לכל תשובה של משתמש (לחישוב "נושא חלש" והתקדמות)
  // ==========================================================================
  answerLog: defineTable({
    userId: v.id('users'),
    questionId: v.id('questions'),
    category: v.string(),
    subCategory: v.optional(v.string()),
    isCorrect: v.boolean(),
    answeredAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_category', ['userId', 'category']),

  // ==========================================================================
  // רכישות — מעקב אחרי גישה בתשלום (רכישה חד-פעמית)
  // ==========================================================================
  purchases: defineTable({
    userId: v.id('users'),
    productId: v.string(), // מזהה המוצר בחנות (למשל "lifetime_access")
    entitlement: v.string(), // שם ההרשאה ב-RevenueCat (למשל "premium")
    platform: v.optional(v.string()), // "ios" | "android"
    revenueCatCustomerId: v.optional(v.string()),
    isActive: v.boolean(), // האם הגישה פעילה כרגע
    purchasedAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_rcCustomer', ['revenueCatCustomerId']),
});
