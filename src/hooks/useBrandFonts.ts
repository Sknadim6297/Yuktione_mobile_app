import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { DMSans_800ExtraBold } from '@expo-google-fonts/dm-sans/800ExtraBold';
import { useFonts } from 'expo-font';

/** DM Sans is the only typeface on the YuktiOne website. */
const BRAND_FONTS = {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
};

/**
 * Loads YuktiOne brand fonts once. Prefer calling from root layout
 * so screens do not flash LoadingState on every mount.
 */
export function useBrandFonts(): boolean {
  const [loaded] = useFonts(BRAND_FONTS);
  return loaded;
}
