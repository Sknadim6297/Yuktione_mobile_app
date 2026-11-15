import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { LibreBaskerville_400Regular } from '@expo-google-fonts/libre-baskerville/400Regular';
import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville/700Bold';
import { useFonts } from 'expo-font';

const BRAND_FONTS = {
  LibreBaskerville_400Regular,
  LibreBaskerville_700Bold,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
};

/**
 * Loads YuktiOne brand fonts once. Prefer calling from root layout
 * so screens do not flash LoadingState on every mount.
 */
export function useBrandFonts(): boolean {
  const [loaded] = useFonts(BRAND_FONTS);
  return loaded;
}
