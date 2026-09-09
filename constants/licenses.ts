// סוגי רישיון נהיגה לבחירה במסך "בחר רישיון".
// `marker` = הסימון במאגר משרד התחבורה (convex/schema.ts questions.licenseTypes)
// מבוסס על docs/design.md (מסך 3)

export type LicenseOption = {
  marker: string; // הערך שנשמר ב-users.licenseType ומסונן מולו
  label: string; // תווית בעברית
  code: string; // קוד הרישיון להצגה
};

export const LICENSE_OPTIONS: LicenseOption[] = [
  { marker: 'B', label: 'רכב פרטי', code: 'B' },
  { marker: 'A', label: 'אופנוע', code: 'A' },
  { marker: '1', label: 'טרקטור', code: 'T' },
  { marker: 'C1', label: 'רכב משא קל', code: 'C1' },
  { marker: 'C', label: 'רכב משא כבד', code: 'C' },
  { marker: 'D', label: 'אוטובוס / מונית', code: 'D' },
];

export const DEFAULT_LICENSE = 'B';

export function licenseLabel(marker: string | undefined): string {
  return LICENSE_OPTIONS.find((o) => o.marker === marker)?.label ?? 'רכב פרטי';
}
