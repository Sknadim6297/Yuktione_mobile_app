import { StyleSheet, Text, View } from 'react-native';

import { brand, customerFonts } from '@/theme';

/** Website eyebrow: short rule + uppercase tracked label (.yk-hero__eyebrow). */
export function Eyebrow({ label, inverse = false }: { label: string; inverse?: boolean }) {
  const color = inverse ? brand.white : brand.plum;
  return (
    <View style={styles.row}>
      <View style={[styles.rule, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rule: { width: 22, height: 1.5, borderRadius: 1 },
  text: { fontFamily: customerFonts.bold, fontSize: 11, letterSpacing: 1.6 },
});
