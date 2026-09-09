// קבועי צבעים עבור האפליקציה
// מבוסס על מערכת העיצוב ב-docs/design.md
// מרכז את פלטת הצבעים עבור מצב בהיר (Light) ומצב כהה (Dark)

// ============================================================================
// Tokens — פלטת המותג (משותפת, לא משתנה בין מצב בהיר לכהה)
// ============================================================================
export const palette = {
  primary: '#1D4ED8', // כחול ראשי — כפתורים, כותרות
  primaryDark: '#1A44BE', // גרדיאנט תחתון של כותרת
  primarySoft: '#6C9CF0', // כפתור משני, רדיו נבחר
  primaryTint: '#EAF1FE', // רקע נבחר עדין
  success: '#3BA55C',
  successBg: '#E7F6EC',
  danger: '#E5484D',
  dangerBg: '#FDECEC',
  warning: '#E8850C',
  gold: '#F5C24B',
  explain: '#6B4EE6',
  white: '#FFFFFF',
  black: '#0B1220',
  muted: '#6B7280', // טקסט משני ניטרלי (זמין גם בלי hook צבעים)
};

const tintColorLight = palette.primary;
const tintColorDark = palette.primarySoft;

export default {
  light: {
    text: '#25324D', // טקסט ראשי (נייבי, לא שחור)
    textSecondary: '#6B7280', // טקסט משני
    background: '#F4F5F7', // רקע מסך
    card: '#FFFFFF', // כרטיסים, שדות
    pill: '#F0F1F5', // רקע תשובה לא-נבחרת
    border: '#E5E7EB',
    tint: tintColorLight,
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#E8EBF2',
    textSecondary: '#9AA3B2',
    background: '#0F1420',
    card: '#1A2130',
    pill: '#232B3B',
    border: '#2C3547',
    tint: tintColorDark,
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
  },
};
