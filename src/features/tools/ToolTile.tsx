import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandGradient } from '@/components/brand';
import { PressCard, RemoteImage } from '@/features/customer/home/media';
import { openLiveTool, toolVisual } from '@/features/customer/liveCatalog';
import { cardDescription, categoryWash, runsInApp } from '@/features/tools/toolsCatalogue';
import type { ApiTool } from '@/services/api/catalog';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { brand, customerFonts, shadows } from '@/theme';

/** Height a tile needs for a given width; skeletons use it so loading doesn't jump. */
export function toolTileArt(width: number): number {
  return Math.round(Math.min(Math.max(width * 0.5, 70), 112));
}

export function toolTileHeight(width: number): number {
  return 120 + toolTileArt(width);
}

/**
 * Website tools-catalog card: small glyph, bold title, two-line description, round plum
 * arrow bottom-left and the 3D illustration floating bottom-right on a soft glow.
 */
export const ToolTile = memo(function ToolTile({ tool, width }: { tool: ApiTool; width: number }) {
  const visual = toolVisual(tool);
  const description = cardDescription(tool);
  const inApp = runsInApp(tool);
  const wash = categoryWash(tool);
  const art = toolTileArt(width);
  return (
    <PressCard
      onPress={() => openLiveTool(tool)}
      label={`${tool.name}. ${description}${inApp ? '' : ' Runs on the YuktiOne website.'}`}
      hint="Opens this tool"
      style={[styles.card, { width, minHeight: toolTileHeight(width) }]}
    >
      <BrandGradient colors={[brand.white, wash[1], wash[0]]} angle={150} style={StyleSheet.absoluteFill} />
      <View style={styles.topRow}>
        <Ionicons name={visual.icon} size={15} color={brand.plum} />
        {inApp ? null : (
          <View style={styles.webTag}>
            <Ionicons name="globe-outline" size={10} color={brand.plum} />
            <Text style={styles.webTagText}>Web</Text>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {tool.name.replace(/-/g, '\u2011')}
      </Text>
      <Text style={styles.desc} numberOfLines={2}>
        {description}
      </Text>
      <View style={[styles.bottomRow, { height: art }]}>
        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={15} color={brand.white} />
        </View>
        <View style={[styles.art, { width: art, height: art }]}>
          <View style={[styles.glow, { width: art, height: art, borderRadius: art / 2 }]} />
          <RemoteImage
            uri={resolveImageUrl(tool.image_url)}
            resizeMode="contain"
            background="transparent"
            fallback={
              <View style={styles.fallback}>
                <Ionicons name={visual.icon} size={Math.round(art * 0.42)} color={brand.plum} />
              </View>
            }
            style={{ width: art, height: art }}
          />
        </View>
      </View>
    </PressCard>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3E3EC',
    backgroundColor: brand.white,
    overflow: 'hidden',
    padding: 12,
    gap: 4,
    ...shadows.sm,
    shadowColor: brand.plum,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 20 },
  webTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: brand.divider,
  },
  webTagText: { fontFamily: customerFonts.semibold, fontSize: 10, color: brand.plum },
  title: {
    fontFamily: customerFonts.bold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.2,
    color: brand.ink,
    minHeight: 36,
    marginTop: 4,
  },
  desc: { fontFamily: customerFonts.regular, fontSize: 11.5, lineHeight: 15.5, color: brand.grey, minHeight: 31 },
  bottomRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: brand.plum,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.brand,
  },
  // Pulls the art toward the corner so it reads as floating off the card, like the website.
  art: { alignItems: 'center', justifyContent: 'center', marginRight: -4, marginBottom: -4 },
  glow: { position: 'absolute', backgroundColor: 'rgba(240, 212, 226, 0.32)' },
  fallback: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
