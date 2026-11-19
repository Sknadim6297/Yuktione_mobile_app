import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { FocalImage } from '@/components/brand';
import { openCategory } from '@/features/categories/categoryHub';
import { formatInr } from '@/features/customer/content';
import { PressCard, RemoteImage, Skeleton } from '@/features/customer/home/media';
import { expertInitials, expertTint, openLiveTool, toolVisual } from '@/features/customer/liveCatalog';
import { ToolTile, toolTileHeight } from '@/features/tools/ToolTile';
import type { ApiExpert, ApiExpertCategory, ApiProgrammeEvent, ApiTool } from '@/services/api/catalog';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { brand, customer, customerFonts, shadows } from '@/theme';

export function openExpert(id: number): void {
  router.push({ pathname: '/experts/profile/[id]', params: { id: String(id) } });
}

/* ------------------------------------------------------------------ */
/* Section header                                                      */
/* ------------------------------------------------------------------ */

export function HomeSection({
  title,
  onSeeAll,
  seeAllLabel,
  children,
}: {
  title: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {onSeeAll ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={seeAllLabel ?? `See all ${title}`}
            onPress={onSeeAll}
            hitSlop={10}
            style={({ pressed }) => [styles.seeAll, pressed && styles.pressedText]}
          >
            <Text style={styles.seeAllText}>See All</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function HomeNotice({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.notice}>
      <Ionicons name="information-circle-outline" size={20} color={customer.muted} />
      <Text style={styles.noticeText}>{text}</Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={styles.noticeAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

export function HomeSearchBar({
  value,
  onChangeText,
  onSubmit,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.search, focused && styles.searchFocused]}>
      <Ionicons name="search-outline" size={20} color={focused ? brand.plum : customer.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        placeholder="Search tools, experts, categories..."
        placeholderTextColor={customer.muted}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="Search tools, experts and categories"
        style={styles.searchInput}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
          hitSlop={10}
        >
          <Ionicons name="close-circle" size={20} color={customer.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

type ResultRow = {
  key: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  tint: string;
  round?: boolean;
  initials?: string;
  onPress: () => void;
};

export function HomeSearchResults({
  term,
  categories,
  tools,
  experts,
  expertsLoading,
  expertsFailed,
  onRetryExperts,
}: {
  term: string;
  categories: ApiExpertCategory[];
  tools: ApiTool[];
  experts: ApiExpert[];
  expertsLoading: boolean;
  expertsFailed: boolean;
  onRetryExperts: () => void;
}) {
  const groups: { title: string; rows: ResultRow[] }[] = [
    {
      title: 'Categories',
      rows: categories.map((category) => ({
        key: `c-${category.slug}`,
        title: category.label,
        subtitle: 'Browse experts for this need',
        image: resolveImageUrl(category.image_url),
        tint: brand.plumSoft,
        onPress: () => openCategory(category),
      })),
    },
    {
      title: 'Tools',
      rows: tools.map((tool) => ({
        key: `t-${tool.slug}`,
        title: tool.name,
        subtitle: tool.explore_category?.label ?? tool.card_description ?? tool.description,
        image: resolveImageUrl(tool.image_url),
        tint: toolVisual(tool).tint,
        onPress: () => openLiveTool(tool),
      })),
    },
    {
      title: 'Experts',
      rows: experts.map((expert) => ({
        key: `e-${expert.id}`,
        title: expert.name,
        subtitle: expert.specialization ?? expert.services[0] ?? null,
        image: resolveImageUrl(expert.photo_url),
        tint: expertTint(expert.id),
        round: true,
        initials: expertInitials(expert.name),
        onPress: () => openExpert(expert.id),
      })),
    },
  ];
  const total = groups.reduce((sum, group) => sum + group.rows.length, 0);

  return (
    <View style={styles.results} accessibilityLiveRegion="polite">
      {groups.map((group) =>
        group.rows.length > 0 ? (
          <View key={group.title} style={styles.resultGroup}>
            <Text style={styles.resultGroupTitle}>{group.title}</Text>
            <View style={styles.resultList}>
              {group.rows.map((row, index) => (
                <PressCard
                  key={row.key}
                  onPress={row.onPress}
                  label={`${row.title}${row.subtitle ? `, ${row.subtitle}` : ''}`}
                  style={[styles.resultRow, index > 0 && styles.resultDivider]}
                >
                  <RemoteImage
                    uri={row.image}
                    background={row.tint}
                    resizeMode={row.round ? 'cover' : 'contain'}
                    inset={row.round ? 0 : 3}
                    fallback={
                      row.initials ? (
                        <View style={styles.centerFill}>
                          <Text style={styles.resultInitials}>{row.initials}</Text>
                        </View>
                      ) : undefined
                    }
                    style={[styles.resultThumb, row.round && styles.resultThumbRound]}
                  />
                  <View style={styles.flex}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {row.title}
                    </Text>
                    {row.subtitle ? (
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
                        {row.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={customer.muted} />
                </PressCard>
              ))}
            </View>
          </View>
        ) : null,
      )}

      {expertsLoading ? (
        <Text style={styles.resultStatus}>Searching experts…</Text>
      ) : expertsFailed ? (
        <HomeNotice text="We couldn't search experts right now." action="Try again" onAction={onRetryExperts} />
      ) : null}

      {total === 0 && !expertsLoading && !expertsFailed ? (
        <View style={styles.noResults}>
          <Ionicons name="search-outline" size={26} color={customer.muted} />
          <Text style={styles.noResultsTitle}>No matches for “{term}”</Text>
          <Text style={styles.noResultsBody}>Try a different word, such as a tool or a need.</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/search')}
        style={({ pressed }) => [styles.fullSearch, pressed && styles.pressedText]}
      >
        <Text style={styles.fullSearchText}>Open full search</Text>
        <Ionicons name="arrow-forward" size={15} color={brand.plum} />
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Hero carousel                                                       */
/* ------------------------------------------------------------------ */

const AUTOPLAY_MS = 4500;

export type HeroSlide = {
  key: string;
  dark?: boolean;
  background: string;
  eyebrow?: string;
  title: string;
  accent: string;
  body: string;
  cta: string;
  href: Href;
  art: (size: { width: number; height: number }) => ReactNode;
};

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduce(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduce;
}

export function HeroCarousel({ width, slides }: { width: number; slides: HeroSlide[] }) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const indexRef = useRef(0);
  /** Slide a programmatic scroll is heading to; intermediate scroll events must not move the dots. */
  const targetRef = useRef<number | null>(null);
  const targetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(true);
  const reduceMotion = useReduceMotion();
  const count = slides.length;
  const height = width < 340 ? 188 : Math.round(Math.min(Math.max(width * 0.5, 190), 250));

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const clearTarget = useCallback(() => {
    targetRef.current = null;
    if (targetTimer.current) clearTimeout(targetTimer.current);
    targetTimer.current = null;
  }, []);

  const goTo = useCallback(
    (next: number, animated = true) => {
      indexRef.current = next;
      setIndex(next);
      clearTarget();
      targetRef.current = next;
      targetTimer.current = setTimeout(clearTarget, 1200);
      scrollRef.current?.scrollTo({ x: next * width, animated });
    },
    [width, clearTarget],
  );

  useEffect(() => clearTarget, [clearTarget]);

  useEffect(() => {
    const safe = Math.min(indexRef.current, Math.max(count - 1, 0));
    goTo(safe, false);
  }, [width, count, goTo]);

  useEffect(() => {
    if (paused || dragging || !focused || reduceMotion || count < 2 || width <= 0) return;
    const timer = setTimeout(() => goTo((indexRef.current + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [index, paused, dragging, focused, reduceMotion, count, width, goTo]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width <= 0) return;
      const next = Math.min(Math.max(Math.round(event.nativeEvent.contentOffset.x / width), 0), count - 1);
      if (targetRef.current !== null) {
        if (next === targetRef.current) clearTarget();
        return;
      }
      if (next !== indexRef.current) {
        indexRef.current = next;
        setIndex(next);
      }
    },
    [width, count, clearTarget],
  );

  const autoplayOn = !paused && !reduceMotion && count > 1;

  return (
    <View style={styles.heroWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          clearTarget();
          setDragging(true);
        }}
        onScrollEndDrag={() => setDragging(false)}
        style={[styles.heroScroller, { width }]}
        accessibilityLabel="Featured highlights"
      >
        {slides.map((slide, slideIndex) => (
          <HeroSlideCard
            key={slide.key}
            slide={slide}
            width={width}
            height={height}
            position={`${slideIndex + 1} of ${count}`}
          />
        ))}
      </ScrollView>

      {count > 1 ? (
        <View style={styles.heroControls}>
          <View style={styles.dots} accessibilityRole="tablist">
            {slides.map((slide, dotIndex) => {
              const active = dotIndex === index;
              return (
                <Pressable
                  key={slide.key}
                  accessibilityRole="tab"
                  accessibilityLabel={`Show slide ${dotIndex + 1} of ${count}`}
                  aria-selected={active}
                  accessibilityState={{ selected: active }}
                  onPress={() => goTo(dotIndex)}
                  hitSlop={8}
                  style={styles.dotHit}
                >
                  <View style={[styles.dot, active && styles.dotActive]} />
                </Pressable>
              );
            })}
          </View>
          {!reduceMotion ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={autoplayOn ? 'Pause slideshow' : 'Play slideshow'}
              onPress={() => setPaused((value) => !value)}
              hitSlop={8}
              style={styles.playButton}
            >
              <Ionicons name={autoplayOn ? 'pause' : 'play'} size={12} color={brand.plum} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const HeroSlideCard = memo(function HeroSlideCard({
  slide,
  width,
  height,
  position,
}: {
  slide: HeroSlide;
  width: number;
  height: number;
  position: string;
}) {
  const wide = width >= 560;
  const compact = width < 340;
  const artWidth = Math.round(width * 0.5);
  const textWidth = Math.round(width * (wide ? 0.5 : 0.58));
  const dark = Boolean(slide.dark);
  const gradientId = `heroFade-${slide.key}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${slide.title} ${slide.accent}. ${slide.cta}`}
      accessibilityHint={`Slide ${position}`}
      onPress={() => router.push(slide.href)}
      style={[styles.slide, { width, minHeight: height, backgroundColor: slide.background }]}
    >
      <View style={[styles.slideArt, { width: artWidth }]}>{slide.art({ width: artWidth, height })}</View>
      <Svg
        style={[styles.slideFade, { left: width - artWidth - 1, width: Math.round(artWidth * 0.55) }]}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={slide.background} stopOpacity="1" />
            <Stop offset="1" stopColor={slide.background} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>

      <View style={[styles.slideText, { width: textWidth }, wide && styles.slideTextWide]}>
        {slide.eyebrow ? (
          <Text style={[styles.slideEyebrow, dark && styles.slideEyebrowDark]} numberOfLines={2}>
            {slide.eyebrow}
          </Text>
        ) : null}
        <Text
          style={[
            styles.slideTitle,
            compact && styles.slideTitleCompact,
            wide && styles.slideTitleWide,
            dark && styles.textWhite,
          ]}
          numberOfLines={3}
        >
          {slide.title}{' '}
          <Text style={dark ? styles.slideAccentDark : styles.slideAccent}>{slide.accent}</Text>
        </Text>
        <Text style={[styles.slideBody, dark && styles.slideBodyDark]} numberOfLines={2}>
          {slide.body}
        </Text>
        <View style={[styles.slideCta, dark && styles.slideCtaDark]}>
          <Text style={[styles.slideCtaText, dark && styles.slideCtaTextDark]} numberOfLines={1}>
            {slide.cta}
          </Text>
          <Ionicons name="arrow-forward" size={13} color={dark ? brand.plum : brand.white} />
        </View>
      </View>
    </Pressable>
  );
});

export function SlideFocalArt({
  source,
  aspectRatio,
  focalX,
  focalY,
}: {
  source: ImageSourcePropType;
  aspectRatio: number;
  focalX?: number;
  focalY?: number;
}) {
  return (
    <FocalImage
      source={source}
      aspectRatio={aspectRatio}
      focalX={focalX}
      focalY={focalY}
      style={StyleSheet.absoluteFill}
    />
  );
}

/** Real featured-expert photos arranged as an overlapping cluster. */
export function ExpertClusterArt({
  experts,
  width,
  height,
}: {
  experts: ApiExpert[];
  width: number;
  height: number;
}) {
  const people = experts.slice(0, 3);
  const big = Math.round(Math.min(height * 0.56, width * 0.62));
  const small = Math.round(big * 0.66);
  const spots = [
    { size: big, top: Math.round(height * 0.22), left: Math.round(width * 0.36) },
    { size: small, top: Math.round(height * 0.1), left: Math.round(width * 0.14) },
    { size: small, top: Math.round(height * 0.56), left: Math.round(width * 0.18) },
  ];
  if (people.length === 0) {
    return (
      <View style={styles.centerFill}>
        <View style={[styles.clusterFallback, { width: big, height: big, borderRadius: big / 2 }]}>
          <Ionicons name="people" size={Math.round(big * 0.42)} color={brand.plum} />
        </View>
      </View>
    );
  }
  return (
    <View style={StyleSheet.absoluteFill}>
      {people.map((expert, index) => {
        const spot = spots[index] ?? spots[0]!;
        return (
          <View
            key={expert.id}
            style={[
              styles.clusterPhoto,
              { width: spot.size, height: spot.size, borderRadius: spot.size / 2, top: spot.top, left: spot.left },
            ]}
          >
            <RemoteImage
              uri={resolveImageUrl(expert.photo_url)}
              background={expertTint(expert.id)}
              fallback={
                <View style={styles.centerFill}>
                  <Text style={styles.clusterInitials}>{expertInitials(expert.name)}</Text>
                </View>
              }
              style={StyleSheet.absoluteFill}
            />
          </View>
        );
      })}
    </View>
  );
}

export function HeroSkeleton({ width }: { width: number }) {
  const height = width < 340 ? 188 : Math.round(Math.min(Math.max(width * 0.5, 190), 250));
  return <Skeleton style={{ width, height, borderRadius: 20 }} />;
}

/* ------------------------------------------------------------------ */
/* Explore by Category                                                 */
/* ------------------------------------------------------------------ */

const CATEGORY_TINTS = [brand.plumSoft, brand.lilacSoft, brand.magentaSoft, brand.heroCream];

export function categoryColumns(contentWidth: number): number {
  if (contentWidth >= 600) return 6;
  if (contentWidth < 300) return 3;
  return 4;
}

export function CategoryGrid({
  categories,
  contentWidth,
}: {
  categories: ApiExpertCategory[];
  contentWidth: number;
}) {
  const columns = categoryColumns(contentWidth);
  const gap = contentWidth < 330 ? 8 : 10;
  const tile = Math.floor((contentWidth - gap * (columns - 1)) / columns);
  return (
    <View style={[styles.grid, { gap }]}>
      {categories.map((category, index) => (
        <CategoryTile
          key={category.slug}
          category={category}
          size={tile}
          tint={CATEGORY_TINTS[index % CATEGORY_TINTS.length] ?? brand.plumSoft}
        />
      ))}
    </View>
  );
}

const CategoryTile = memo(function CategoryTile({
  category,
  size,
  tint,
}: {
  category: ApiExpertCategory;
  size: number;
  tint: string;
}) {
  return (
    <PressCard
      onPress={() => openCategory(category)}
      label={category.label}
      hint="Shows tools, experts and programmes for this need"
      style={[styles.categoryTile, { width: size }]}
    >
      <View style={[styles.categoryFrame, { width: size, height: size, backgroundColor: tint }]}>
        <RemoteImage
          uri={resolveImageUrl(category.image_url)}
          background={tint}
          style={styles.categoryImage}
        />
      </View>
      <Text style={[styles.categoryLabel, size < 76 && styles.categoryLabelSmall]} numberOfLines={2}>
        {category.label}
      </Text>
    </PressCard>
  );
});

export function CategorySkeleton({ contentWidth }: { contentWidth: number }) {
  const columns = categoryColumns(contentWidth);
  const tile = Math.floor((contentWidth - 10 * (columns - 1)) / columns);
  return (
    <View style={[styles.grid, { gap: 10 }]} accessibilityLabel="Loading categories">
      {Array.from({ length: columns * 2 }, (_, key) => (
        <View key={key} style={{ width: tile, gap: 6 }}>
          <Skeleton style={{ width: tile, height: tile, borderRadius: 16 }} />
          <Skeleton style={{ width: tile * 0.8, height: 10, alignSelf: 'center' }} />
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Popular Tools                                                       */
/* ------------------------------------------------------------------ */

export function toolColumns(contentWidth: number): number {
  return contentWidth >= 600 ? 4 : 2;
}

export function ToolGrid({ tools, contentWidth }: { tools: ApiTool[]; contentWidth: number }) {
  const columns = toolColumns(contentWidth);
  const gap = 12;
  const cardWidth = Math.floor((contentWidth - gap * (columns - 1)) / columns);
  return (
    <View style={[styles.grid, { gap }]}>
      {tools.map((tool) => (
        <ToolTile key={tool.slug} tool={tool} width={cardWidth} />
      ))}
    </View>
  );
}

export function ToolGridSkeleton({ contentWidth }: { contentWidth: number }) {
  const columns = toolColumns(contentWidth);
  const cardWidth = Math.floor((contentWidth - 12 * (columns - 1)) / columns);
  return (
    <View style={[styles.grid, { gap: 12 }]} accessibilityLabel="Loading tools">
      {Array.from({ length: 4 }, (_, key) => (
        <Skeleton key={key} style={{ width: cardWidth, height: toolTileHeight(cardWidth), borderRadius: 20 }} />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal rails: experts and events                                */
/* ------------------------------------------------------------------ */

export function Rail({ children, label }: { children: ReactNode; label: string }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.rail}
      contentContainerStyle={styles.railContent}
      accessibilityLabel={label}
    >
      {children}
    </ScrollView>
  );
}

export function RailSkeleton({ width, height }: { width: number; height: number }) {
  return (
    <View style={[styles.rail, styles.railContent, styles.row]} accessibilityLabel="Loading">
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} style={{ width, height, borderRadius: 16 }} />
      ))}
    </View>
  );
}

export const EXPERT_CARD_WIDTH = 220;

export const ExpertCard = memo(function ExpertCard({ expert }: { expert: ApiExpert }) {
  const specialty = expert.specialization ?? expert.services[0] ?? null;
  return (
    <PressCard
      onPress={() => openExpert(expert.id)}
      label={`${expert.name}${specialty ? `, ${specialty}` : ''}`}
      hint="Opens the expert's profile"
      style={styles.expertCard}
    >
      <RemoteImage
        uri={resolveImageUrl(expert.photo_url)}
        background={expertTint(expert.id)}
        fallback={
          <View style={styles.centerFill}>
            <Text style={styles.expertInitials}>{expertInitials(expert.name)}</Text>
          </View>
        }
        style={styles.expertPhoto}
      />
      <View style={styles.flex}>
        <View style={styles.expertNameRow}>
          <Text style={styles.expertName} numberOfLines={2}>
            {expert.name}
          </Text>
          {expert.verified ? (
            <Ionicons name="checkmark-circle" size={14} color={brand.plum} accessibilityLabel="Verified" />
          ) : null}
        </View>
        {specialty ? (
          <Text style={styles.expertSpecialty} numberOfLines={2}>
            {specialty}
          </Text>
        ) : null}
      </View>
    </PressCard>
  );
});

function eventDate(raw: string): Date | null {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00` : raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function eventCardWidth(contentWidth: number): number {
  return Math.round(Math.min(contentWidth * 0.86, 340));
}

export const EventCard = memo(function EventCard({
  event,
  width,
  today,
}: {
  event: ApiProgrammeEvent;
  width: number;
  today: Date;
}) {
  const date = eventDate(event.date);
  const ended = date ? date < today : false;
  const meta = [event.mini_heading, event.time, event.professional?.name].filter(Boolean).join(' · ');
  const imageWidth = Math.round(width * 0.4);
  return (
    <PressCard
      onPress={() => router.push('/programmes')}
      label={`${event.heading}${date ? `, ${date.toDateString()}` : ''}${ended ? ', ended' : ''}`}
      hint="Opens programmes and events"
      style={[styles.eventCard, { width }]}
    >
      <RemoteImage
        uri={resolveImageUrl(event.card_image_url)}
        background={brand.plumSoft}
        style={[styles.eventImage, { width: imageWidth }]}
      >
        {date ? (
          <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>{date.getDate()}</Text>
            <Text style={styles.dateMonth}>
              {date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
            </Text>
            <Text style={styles.dateYear}>{date.getFullYear()}</Text>
          </View>
        ) : null}
      </RemoteImage>
      <View style={styles.eventBody}>
        {ended ? (
          <View style={styles.endedChip}>
            <Text style={styles.endedText}>Ended</Text>
          </View>
        ) : null}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.heading}
        </Text>
        {meta ? (
          <Text style={styles.eventMeta} numberOfLines={2}>
            {meta}
          </Text>
        ) : null}
        {event.starting_fees ? (
          <Text style={styles.eventFee}>From {formatInr(event.starting_fees)}</Text>
        ) : null}
        <View style={styles.eventCta}>
          <Text style={styles.eventCtaText}>View details</Text>
          <Ionicons name="arrow-forward" size={13} color={brand.plum} />
        </View>
      </View>
    </PressCard>
  );
});

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export function HeaderAvatar({ uri, initials }: { uri: string | null; initials: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (uri && failed !== uri) {
    return <Image source={{ uri }} style={styles.headerAvatar} onError={() => setFailed(uri)} />;
  }
  if (initials) {
    return (
      <View style={[styles.headerAvatar, styles.headerAvatarInitials]}>
        <Text style={styles.headerInitials}>{initials}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.headerAvatar, styles.headerAvatarGuest]}>
      <Ionicons name="person-outline" size={19} color={brand.plum} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row' },
  centerFill: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  pressedText: { opacity: 0.65 },
  textWhite: { color: brand.white },

  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: {
    flex: 1,
    fontFamily: customerFonts.bold,
    fontSize: 18,
    color: customer.navy,
    letterSpacing: -0.2,
  },
  seeAll: { paddingVertical: 4, paddingLeft: 8 },
  seeAllText: { fontFamily: customerFonts.semibold, fontSize: 14, color: brand.plum },

  notice: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noticeText: { flex: 1, fontFamily: customerFonts.regular, fontSize: 13.5, lineHeight: 19, color: customer.body },
  noticeAction: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.plum },

  search: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: customer.line,
    backgroundColor: customer.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...shadows.sm,
  },
  searchFocused: { borderColor: brand.plum },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: customerFonts.regular,
    fontSize: 15,
    color: customer.navy,
    paddingVertical: 12,
  },

  results: { gap: 16 },
  resultGroup: { gap: 8 },
  resultGroupTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: customer.muted,
  },
  resultList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    paddingHorizontal: 12,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  resultDivider: { borderTopWidth: 1, borderTopColor: customer.line },
  resultThumb: { width: 42, height: 42, borderRadius: 12 },
  resultThumbRound: { borderRadius: 21 },
  resultInitials: { fontFamily: customerFonts.bold, fontSize: 14, color: customer.navy },
  resultTitle: { fontFamily: customerFonts.semibold, fontSize: 14.5, color: customer.navy },
  resultSubtitle: { fontFamily: customerFonts.regular, fontSize: 12.5, color: customer.muted, marginTop: 1 },
  resultStatus: { fontFamily: customerFonts.medium, fontSize: 13, color: customer.muted, textAlign: 'center' },
  noResults: { alignItems: 'center', gap: 6, paddingVertical: 18 },
  noResultsTitle: { fontFamily: customerFonts.bold, fontSize: 15, color: customer.navy, textAlign: 'center' },
  noResultsBody: { fontFamily: customerFonts.regular, fontSize: 13, color: customer.muted, textAlign: 'center' },
  fullSearch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  fullSearchText: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.plum },

  heroWrap: { gap: 10 },
  heroScroller: { borderRadius: 20, ...shadows.sm },
  slide: { borderRadius: 20, overflow: 'hidden' },
  slideArt: { position: 'absolute', top: 0, right: 0, bottom: 0, overflow: 'hidden' },
  slideFade: { position: 'absolute', top: 0, bottom: 0 },
  slideText: { flex: 1, justifyContent: 'center', paddingLeft: 18, paddingRight: 8, paddingVertical: 16, gap: 6 },
  slideTextWide: { paddingLeft: 28, gap: 8 },
  slideEyebrow: {
    fontFamily: customerFonts.bold,
    fontSize: 10.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: brand.magenta,
  },
  slideEyebrowDark: { color: brand.underline },
  slideTitle: {
    fontFamily: customerFonts.bold,
    fontSize: 19,
    lineHeight: 24,
    color: customer.navy,
    letterSpacing: -0.3,
  },
  slideTitleCompact: { fontSize: 17, lineHeight: 21 },
  slideTitleWide: { fontSize: 26, lineHeight: 32 },
  slideAccent: { color: brand.plum },
  slideAccentDark: { color: brand.underline },
  slideBody: { fontFamily: customerFonts.regular, fontSize: 12, lineHeight: 16.5, color: customer.body },
  slideBodyDark: { color: 'rgba(255,255,255,0.86)' },
  slideCta: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: brand.plum,
    maxWidth: '100%',
  },
  slideCtaDark: { backgroundColor: brand.white },
  slideCtaText: { fontFamily: customerFonts.bold, fontSize: 12.5, color: brand.white, flexShrink: 1 },
  slideCtaTextDark: { color: brand.plum },
  heroControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  dotHit: { paddingHorizontal: 3, paddingVertical: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: brand.plumSoftDeep },
  dotActive: { width: 20, backgroundColor: brand.plum },
  playButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.plumSoft,
  },
  clusterPhoto: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: brand.white,
    ...shadows.sm,
  },
  clusterInitials: { fontFamily: customerFonts.bold, fontSize: 18, color: customer.navy },
  clusterFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: brand.white },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  categoryTile: { alignItems: 'center', gap: 6 },
  categoryFrame: { borderRadius: 18, padding: 5 },
  categoryImage: { flex: 1, borderRadius: 14 },
  categoryLabel: {
    fontFamily: customerFonts.semibold,
    fontSize: 12,
    lineHeight: 15,
    color: customer.navy,
    textAlign: 'center',
    minHeight: 30,
  },
  categoryLabelSmall: { fontSize: 11, lineHeight: 14, minHeight: 28 },

  rail: { marginHorizontal: -16 },
  railContent: { paddingHorizontal: 16, paddingVertical: 2, gap: 12 },

  expertCard: {
    width: EXPERT_CARD_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    ...shadows.sm,
  },
  expertPhoto: { width: 52, height: 52, borderRadius: 26 },
  expertInitials: { fontFamily: customerFonts.bold, fontSize: 16, color: customer.navy },
  expertNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expertName: { flexShrink: 1, fontFamily: customerFonts.bold, fontSize: 14, color: customer.navy },
  expertSpecialty: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: customer.muted,
    marginTop: 2,
  },

  eventCard: {
    flexDirection: 'row',
    minHeight: 136,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: customer.line,
    backgroundColor: customer.white,
    overflow: 'hidden',
    ...shadows.sm,
  },
  eventImage: { alignSelf: 'stretch' },
  dateBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    minWidth: 44,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: brand.white,
    alignItems: 'center',
    ...shadows.sm,
  },
  dateDay: { fontFamily: customerFonts.bold, fontSize: 17, lineHeight: 20, color: brand.plum },
  dateMonth: { fontFamily: customerFonts.bold, fontSize: 10, letterSpacing: 0.6, color: customer.navy },
  dateYear: { fontFamily: customerFonts.medium, fontSize: 9, color: customer.muted },
  eventBody: { flex: 1, minWidth: 0, padding: 12, gap: 4 },
  endedChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: brand.divider,
  },
  endedText: { fontFamily: customerFonts.bold, fontSize: 10.5, color: customer.muted },
  eventTitle: { fontFamily: customerFonts.bold, fontSize: 14, lineHeight: 18, color: customer.navy },
  eventMeta: { fontFamily: customerFonts.regular, fontSize: 12, lineHeight: 16, color: customer.muted },
  eventFee: { fontFamily: customerFonts.bold, fontSize: 12, color: brand.plum },
  eventCta: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 4 },
  eventCtaText: { fontFamily: customerFonts.bold, fontSize: 12.5, color: brand.plum },

  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerAvatarInitials: { backgroundColor: brand.plum, alignItems: 'center', justifyContent: 'center' },
  headerInitials: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.white },
  headerAvatarGuest: {
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: customer.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
