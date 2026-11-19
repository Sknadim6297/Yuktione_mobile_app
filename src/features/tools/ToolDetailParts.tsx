import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { BrandGradient, PrimaryButton, SecondaryButton } from '@/components/brand';
import { RemoteImage, Skeleton } from '@/features/customer/home/media';
import { toolVisual } from '@/features/customer/liveCatalog';
import { CustomerPage } from '@/features/customer/ui';
import {
  cardDescription,
  categoryWash,
  runsInApp,
  ToolsRequestError,
  WEBSITE_ACCESS,
} from '@/features/tools/toolsCatalogue';
import type { ApiTool } from '@/services/api/catalog';
import { resolveImageUrl, resolveWebsiteUrl } from '@/services/media/imageUrl';
import { brand, customerFonts, shadows } from '@/theme';

export function backToTools(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/tools');
}

export async function openToolOnWebsite(tool: ApiTool): Promise<void> {
  const url = resolveWebsiteUrl(tool.web_url);
  if (!url) {
    Alert.alert(tool.name, 'The website address for this tool is not available right now.');
    return;
  }
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open the website', url);
  }
}

/** Website illustration, category and card copy — shared by every tool detail screen. */
export function ToolHeroCard({ tool }: { tool: ApiTool }) {
  const visual = toolVisual(tool);
  const wash = categoryWash(tool);
  const inApp = runsInApp(tool);
  return (
    <View style={styles.hero}>
      <View style={styles.heroArt}>
        <BrandGradient colors={[wash[0], wash[1], brand.white]} angle={170} style={StyleSheet.absoluteFill} />
        <RemoteImage
          uri={resolveImageUrl(tool.image_url)}
          resizeMode="contain"
          background="transparent"
          label={tool.name}
          fallback={
            <View style={styles.heroFallback}>
              <Ionicons name={visual.icon} size={52} color={brand.plum} />
            </View>
          }
          style={styles.heroImage}
        />
      </View>
      <View style={styles.heroBody}>
        <View style={styles.badges}>
          {tool.explore_category ? <Badge label={tool.explore_category.label} /> : null}
          <Badge label={tool.access_type === 'paid' ? 'Paid' : 'Free'} />
          <Badge
            icon={inApp ? 'phone-portrait-outline' : 'globe-outline'}
            label={inApp ? 'In the app' : 'Runs on the website'}
          />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {tool.name}
        </Text>
        <Text style={styles.lead}>{cardDescription(tool)}</Text>
      </View>
    </View>
  );
}

function Badge({ label, icon }: { label: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.badge}>
      {icon ? <Ionicons name={icon} size={12} color={brand.plum} /> : null}
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const ACCESS_COPY = {
  'guest-try': {
    icon: 'person-outline',
    title: 'Open to everyone',
    body: 'Anyone can use this tool. Saving results and viewing history need a signed-in YuktiOne account.',
  },
  'login-to-use': {
    icon: 'lock-closed-outline',
    title: 'Sign-in needed',
    body: 'This tracker keeps your entries in your YuktiOne account, so the website asks you to sign in to use it.',
  },
  'login-required': {
    icon: 'lock-closed-outline',
    title: 'Sign-in required',
    body: 'Every step of this tool is available to signed-in YuktiOne members only.',
  },
} as const;

export function AccessNote({ slug }: { slug: string }) {
  const rule = WEBSITE_ACCESS[slug];
  if (!rule) return null;
  const copy = ACCESS_COPY[rule];
  return (
    <View style={styles.note}>
      <Ionicons name={copy.icon} size={18} color={brand.plum} />
      <View style={styles.noteText}>
        <Text style={styles.noteTitle}>{copy.title}</Text>
        <Text style={styles.noteBody}>{copy.body}</Text>
      </View>
    </View>
  );
}

/** Tools without a native mobile runner: real data, honest status, and a hand-off to the website tool. */
export function WebsiteToolScreen({ tool }: { tool: ApiTool }) {
  const full = tool.description?.trim();
  return (
    <CustomerPage
      onBack={backToTools}
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            label="Open on YuktiOne website"
            icon="open-outline"
            iconPosition="end"
            onPress={() => void openToolOnWebsite(tool)}
            accessibilityHint="Opens this tool in your browser"
          />
        </View>
      }
    >
      <ToolHeroCard tool={tool} />
      {full && full !== cardDescription(tool) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this tool</Text>
          <Text style={styles.body}>{full}</Text>
        </View>
      ) : null}
      <AccessNote slug={tool.slug} />
      <View style={styles.note}>
        <Ionicons name="phone-portrait-outline" size={18} color={brand.plum} />
        <View style={styles.noteText}>
          <Text style={styles.noteTitle}>Runs on the YuktiOne website</Text>
          <Text style={styles.noteBody}>
            The full {tool.name} experience is on the website. A native version isn&apos;t in the app yet, so it opens
            in your browser.
          </Text>
        </View>
      </View>
    </CustomerPage>
  );
}

export function ToolLoadingScreen() {
  return (
    <CustomerPage onBack={backToTools}>
      <View accessibilityLabel="Loading tool" style={styles.loading}>
        <Skeleton style={{ height: 210, borderRadius: 22 }} />
        <Skeleton style={{ height: 22, width: '60%' }} />
        <Skeleton style={{ height: 64 }} />
      </View>
    </CustomerPage>
  );
}

export function ToolErrorScreen({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const missing = error instanceof ToolsRequestError && error.status === 404;
  return (
    <CustomerPage onBack={backToTools}>
      <View style={styles.state}>
        <View style={styles.stateMark}>
          <Ionicons name={missing ? 'search-outline' : 'cloud-offline-outline'} size={26} color={brand.plum} />
        </View>
        <Text style={styles.stateTitle}>{missing ? 'Tool not found' : "We couldn't load this tool"}</Text>
        <Text style={styles.stateBody}>
          {missing
            ? 'This tool is not available right now. It may have been unpublished.'
            : (error?.message ?? 'Please check your connection and try again.')}
        </Text>
        <View style={styles.stateActions}>
          {missing ? null : <PrimaryButton label="Try again" onPress={onRetry} compact />}
          <SecondaryButton label="Back to Tools" onPress={() => router.replace('/(tabs)/tools')} compact />
        </View>
      </View>
    </CustomerPage>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: brand.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3E6ED',
    overflow: 'hidden',
    ...shadows.sm,
  },
  heroArt: { height: 176, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width: 150, height: 150 },
  heroFallback: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  heroBody: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 18, gap: 8 },
  title: { fontFamily: customerFonts.bold, fontSize: 24, lineHeight: 29, letterSpacing: -0.6, color: brand.ink },
  lead: { fontFamily: customerFonts.regular, fontSize: 14.5, lineHeight: 21, color: brand.grey },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: brand.plumSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontFamily: customerFonts.semibold, fontSize: 11.5, color: brand.plum },
  section: { gap: 6 },
  sectionTitle: { fontFamily: customerFonts.bold, fontSize: 17, color: brand.ink },
  body: { fontFamily: customerFonts.regular, fontSize: 14, lineHeight: 21, color: brand.grey },
  note: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: brand.pearl,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  noteText: { flex: 1, gap: 2 },
  noteTitle: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.ink },
  noteBody: { fontFamily: customerFonts.regular, fontSize: 13, lineHeight: 19, color: brand.grey },
  footer: { gap: 8 },
  loading: { gap: 14 },
  state: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
    marginTop: 24,
    borderRadius: 22,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  stateMark: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: brand.plumSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stateTitle: { fontFamily: customerFonts.bold, fontSize: 18, color: brand.ink, textAlign: 'center' },
  stateBody: { fontFamily: customerFonts.regular, fontSize: 14, lineHeight: 20, color: brand.grey, textAlign: 'center' },
  stateActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 8 },
});
