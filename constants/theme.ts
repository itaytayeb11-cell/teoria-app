// hook לקבלת פלטת הצבעים הנוכחית (בהיר/כהה) — ראה docs/design.md
import { useColorScheme } from 'react-native';
import Colors, { palette } from './Colors';

export function useAppColors() {
  const scheme = useColorScheme() ?? 'light';
  return { ...Colors[scheme], ...palette, scheme };
}

export { palette };
