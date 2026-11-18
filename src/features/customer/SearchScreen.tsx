import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { PressCard, RemoteImage } from '@/features/customer/home/media';
import { expertInitials, expertTint, openLiveTool, toolVisual } from '@/features/customer/liveCatalog';
import { CustomerPage } from '@/features/customer/ui';
import { fetchExperts, fetchProgrammeEvents, fetchTools } from '@/services/api/catalog';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { customer, customerFonts } from '@/theme';

const LIVE = !FRONTEND_ONLY && isApiConfigured();
const MIN_LENGTH = 2;
const DEBOUNCE_MS = 300;
const EXPERT_LIMIT = 10;

function useDebounced(value: string, delay: number): [string, (next: string) => void] {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return [debounced, setDebounced];
}

function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/home');
}

export function SearchScreen() {
  const [text, setText] = useState('');
  const trimmed = text.trim();
  const [term, flush] = useDebounced(trimmed, DEBOUNCE_MS);
  const active = LIVE && term.length >= MIN_LENGTH;

  const tools = useQuery({
    queryKey: ['v1', 'tools', 'search', term],
    queryFn: async () => {
      const result = await fetchTools({ q: term });
      if (!result.ok) throw new Error(result.message);
      return result.tools;
    },
    enabled: active,
  });

  const experts = useQuery({
    queryKey: ['v1', 'experts', 'search', term],
    queryFn: async () => {
      const result = await fetchExperts({ q: term, limit: EXPERT_LIMIT });
      if (!result.ok) throw new Error(result.message);
      return result.experts;
    },
    enabled: active,
  });

  const events = useQuery({
    queryKey: ['v1', 'programme-events'],
    queryFn: async () => {
      const result = await fetchProgrammeEvents();
      if (!result.ok) throw new Error(result.message);
      return result;
    },
    enabled: LIVE,
  });

  const programmes = useMemo(() => {
    if (term.length < MIN_LENGTH) return [];
    const needle = term.toLowerCase();
    return (events.data?.events ?? []).filter((event) =>
      `${event.heading} ${event.mini_heading} ${event.short_description}`.toLowerCase().includes(needle),
    );
  }, [events.data, term]);

  const typing = trimmed !== term;
  const loading = typing || (active && (tools.isPending || experts.isPending));
  const failed = tools.isError && experts.isError;
  const toolResults = tools.data ?? [];
  const expertResults = experts.data ?? [];
  const total = toolResults.length + expertResults.length + programmes.length;

  let body: ReactNode;
  if (!LIVE) {
    body = <Notice icon="cloud-offline-outline" title="Search needs a connection to YuktiOne." />;
  } else if (trimmed.length < MIN_LENGTH) {
    body = (
      <Notice
        icon="search-outline"
        title="Find experts, tools and programmes"
        body={`Type at least ${MIN_LENGTH} letters, for example “career” or “journal”.`}
      />
    );
  } else if (loading) {
    body = (
      <View style={styles.loading} accessibilityLiveRegion="polite">
        <ActivityIndicator color={customer.teal} />
        <Text style={styles.muted}>Searching…</Text>
      </View>
    );
  } else if (failed) {
    body = (
      <Notice
        icon="alert-circle-outline"
        title="Search isn't available right now."
        body="Check your connection and try again."
        action="Try again"
        onAction={() => {
          void tools.refetch();
          void experts.refetch();
        }}
      />
    );
  } else if (total === 0) {
    body = (
      <Notice
        icon="search-outline"
        title={`No results for “${term}”`}
        body="Try a shorter or different word, or browse everything."
        action="Browse experts"
        onAction={() => router.push('/(tabs)/experts')}
        secondary="Browse tools"
        onSecondary={() => router.push('/(tabs)/tools')}
      />
    );
  } else {
    body = (
      <View style={styles.results} accessibilityLiveRegion="polite">
        {expertResults.length > 0 ? (
          <Group title="Experts">
            {expertResults.map((expert) => (
              <ResultRow
                key={expert.id}
                title={expert.name}
                subtitle={expert.specialization ?? expert.services[0] ?? null}
                onPress={() =>
                  router.push({ pathname: '/experts/profile/[id]', params: { id: String(expert.id) } })
                }
                image={
                  <RemoteImage
                    uri={resolveImageUrl(expert.photo_url)}
                    background={expertTint(expert.id)}
                    fallback={
                      <View style={styles.initialsWrap}>
                        <Text style={styles.initials}>{expertInitials(expert.name)}</Text>
                      </View>
                    }
                    style={[styles.thumb, styles.thumbRound]}
                  />
                }
              />
            ))}
            {expertResults.length >= EXPERT_LIMIT ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/experts/browse', params: { q: term } })}
                style={styles.seeAll}
              >
                <Text style={styles.seeAllText}>See all expert results</Text>
              </Pressable>
            ) : null}
          </Group>
        ) : experts.isError ? (
          <Text style={styles.muted}>Expert results couldn&apos;t be loaded.</Text>
        ) : null}

        {toolResults.length > 0 ? (
          <Group title="Tools">
            {toolResults.map((tool) => (
              <ResultRow
                key={tool.slug}
                title={tool.name}
                subtitle={tool.mobile_ready ? tool.category?.name ?? null : 'On the YuktiOne website'}
                onPress={() => openLiveTool(tool)}
                image={
                  <RemoteImage
                    uri={resolveImageUrl(tool.image_url)}
                    resizeMode="contain"
                    inset={4}
                    background={toolVisual(tool).tint}
                    style={styles.thumb}
                  />
                }
              />
            ))}
          </Group>
        ) : tools.isError ? (
          <Text style={styles.muted}>Tool results couldn&apos;t be loaded.</Text>
        ) : null}

        {programmes.length > 0 ? (
          <Group title="Programmes">
            {programmes.map((event) => (
              <ResultRow
                key={event.id}
                title={event.heading}
                subtitle={event.mini_heading || null}
                onPress={() => router.push('/programmes')}
                image={<RemoteImage uri={resolveImageUrl(event.card_image_url)} style={styles.thumb} />}
              />
            ))}
          </Group>
        ) : null}
      </View>
    );
  }

  return (
    <CustomerPage onBack={goBack} dismissKeyboardOnDrag>
      <View style={styles.inputWrap}>
        <Ionicons name="search-outline" size={20} color={customer.teal} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Search experts, tools and programmes"
          placeholderTextColor={customer.muted}
          accessibilityLabel="Search experts, tools and programmes"
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={() => {
            flush(trimmed);
            Keyboard.dismiss();
          }}
          maxLength={100}
          style={styles.input}
        />
        {text ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setText('')}
            hitSlop={10}
          >
            <Ionicons name="close-circle" size={20} color={customer.muted} />
          </Pressable>
        ) : null}
      </View>
      {body}
    </CustomerPage>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

function ResultRow({
  title,
  subtitle,
  image,
  onPress,
}: {
  title: string;
  subtitle: string | null;
  image: ReactNode;
  onPress: () => void;
}) {
  return (
    <PressCard onPress={onPress} label={subtitle ? `${title}, ${subtitle}` : title} style={styles.row}>
      {image}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.muted} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={customer.muted} />
    </PressCard>
  );
}

function Notice({
  icon,
  title,
  body,
  action,
  onAction,
  secondary,
  onSecondary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  action?: string;
  onAction?: () => void;
  secondary?: string;
  onSecondary?: () => void;
}) {
  return (
    <View style={styles.notice} accessibilityLiveRegion="polite">
      <Ionicons name={icon} size={28} color={customer.teal} />
      <Text style={styles.noticeTitle}>{title}</Text>
      {body ? <Text style={styles.noticeBody}>{body}</Text> : null}
      {action && onAction ? (
        <View style={styles.noticeActions}>
          <Pressable accessibilityRole="button" onPress={onAction} style={styles.noticeButton}>
            <Text style={styles.noticeButtonText}>{action}</Text>
          </Pressable>
          {secondary && onSecondary ? (
            <Pressable
              accessibilityRole="button"
              onPress={onSecondary}
              style={[styles.noticeButton, styles.noticeButtonLight]}
            >
              <Text style={[styles.noticeButtonText, styles.noticeButtonTextDark]}>{secondary}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.teal,
    backgroundColor: customer.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 50,
    fontFamily: customerFonts.regular,
    fontSize: 15,
    color: customer.navy,
  },
  loading: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  muted: { fontFamily: customerFonts.regular, fontSize: 13, color: customer.muted },
  results: { gap: 20 },
  group: { gap: 10 },
  groupTitle: { fontFamily: customerFonts.bold, fontSize: 16, color: customer.navy },
  groupCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: customerFonts.bold, fontSize: 15, color: customer.navy },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  thumbRound: { borderRadius: 24 },
  initialsWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: customerFonts.bold, fontSize: 15, color: customer.navy },
  seeAll: { paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: customer.line },
  seeAllText: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.teal },
  notice: { alignItems: 'center', gap: 8, paddingVertical: 32, paddingHorizontal: 12 },
  noticeTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 17,
    color: customer.navy,
    textAlign: 'center',
  },
  noticeBody: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: customer.body,
    textAlign: 'center',
  },
  noticeActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  noticeButton: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: customer.teal,
  },
  noticeButtonLight: { backgroundColor: customer.white, borderWidth: 1, borderColor: customer.line },
  noticeButtonText: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.white },
  noticeButtonTextDark: { color: customer.navy },
});
