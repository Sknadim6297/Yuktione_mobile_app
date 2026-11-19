import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandGradient, PrimaryButton } from '@/components/brand';
import { openDates, planTitle, rupees, sessionsLabel, shortDate, useExpertAvailability } from '@/features/booking/bookingData';
import { RemoteImage, Skeleton } from '@/features/customer/home/media';
import { expertInitials, expertTint } from '@/features/customer/liveCatalog';
import { StatePanel } from '@/features/experts/ExpertsDirectoryScreen';
import {
  EXPERTS_LIVE,
  experienceLabel,
  expertRole,
  expertWebsitePath,
  formatPrice,
  hasReviews,
  useExpertDetail,
} from '@/features/experts/expertsDirectory';
import { buildOriginUrl } from '@/constants/config';
import type { ApiExpert, ApiExpertReview, ApiSessionRate } from '@/services/api/catalog';
import { resolveImageUrl } from '@/services/media/imageUrl';
import { brand, customer, customerFonts, shadows } from '@/theme';

const MAX_FRAME = 720;
const BIO_PREVIEW = 280;

type ProfileTab = 'about' | 'services' | 'reviews' | 'qualifications';

const CAN_SHARE =
  Platform.OS !== 'web' || (typeof navigator !== 'undefined' && typeof navigator.share === 'function');

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/experts');
}

function openBooking(id: number) {
  router.push({ pathname: '/experts/book/[id]', params: { id: String(id) } });
}

/**
 * Expert profile — website professionals/details/{id} (expert-profile.blade.php): hero with
 * availability, trust cards, About / Services / Reviews / Qualifications tabs and booking.
 */
export function ExpertProfileDetailScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const frame = Math.min(width, MAX_FRAME);
  const validId = /^\d+$/.test(id);
  const detail = useExpertDetail(id);
  const expert = detail.data;

  const topBar = (
    <View style={[styles.topBar, { top: Math.max(insets.top, 10) }]} pointerEvents="box-none">
      <RoundButton icon="chevron-back" label="Go back" onPress={goBack} />
      {expert && CAN_SHARE ? <RoundButton icon="share-social-outline" label="Share profile" onPress={() => void shareExpert(expert)} /> : null}
    </View>
  );

  if (!EXPERTS_LIVE || !validId || (detail.isError && (detail.error as { status?: number }).status === 404)) {
    return (
      <View style={[styles.page, styles.centerPage, { paddingTop: insets.top + 64 }]}>
        {topBar}
        <StatePanel
          icon="person-outline"
          title="This profile isn't available"
          body={
            EXPERTS_LIVE
              ? 'The expert may no longer be listed on YuktiOne. Browse other experts instead.'
              : 'The YuktiOne server address is not configured in this build.'
          }
          primary={{ label: 'Browse experts', onPress: () => router.replace('/(tabs)/experts') }}
        />
      </View>
    );
  }

  if (detail.isError) {
    return (
      <View style={[styles.page, styles.centerPage, { paddingTop: insets.top + 64 }]}>
        {topBar}
        <StatePanel
          icon="cloud-offline-outline"
          title="We couldn't load this profile"
          body={detail.error.message}
          primary={{ label: 'Try again', onPress: () => void detail.refetch() }}
        />
      </View>
    );
  }

  if (!expert) {
    return (
      <View style={styles.page} accessibilityLabel="Loading expert profile">
        {topBar}
        <Skeleton style={{ width: '100%', height: Math.min(frame * 0.9, 380), borderRadius: 0 }} />
        <View style={[styles.frame, { width: frame, gap: 12, padding: 16 }]}>
          <Skeleton style={{ width: '70%', height: 26, borderRadius: 8 }} />
          <Skeleton style={{ width: '45%', height: 16, borderRadius: 8 }} />
          <Skeleton style={{ width: '100%', height: 120, borderRadius: 20 }} />
          <Skeleton style={{ width: '100%', height: 120, borderRadius: 20 }} />
        </View>
      </View>
    );
  }

  return <ProfileBody expert={expert} frame={frame} topBar={topBar} />;
}

async function shareExpert(expert: ApiExpert) {
  const url = buildOriginUrl(expertWebsitePath(expert));
  const role = expertRole(expert);
  try {
    await Share.share({
      title: expert.name,
      message: `${expert.name}${role ? ` — ${role}` : ''} on YuktiOne\n${url}`,
      url,
    });
  } catch {
    // Dismissed or unsupported share target.
  }
}

function ProfileBody({ expert, frame, topBar }: { expert: ApiExpert; frame: number; topBar: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const availability = useExpertAvailability(expert.id);
  const [tab, setTab] = useState<ProfileTab>('about');
  const role = expertRole(expert);
  const price = formatPrice(expert.lowest_session_price ?? expert.starting_price);
  const rated = hasReviews(expert);
  const photo = resolveImageUrl(expert.photo_url);
  const heroHeight = Math.round(Math.min(frame * 0.92, 400));
  const experience = experienceLabel(expert.experience);
  const chips = expert.chips?.length ? expert.chips : uniqueServices(expert);
  const rates = expert.session_rates ?? [];
  const reviews = expert.reviews ?? [];
  const qualifications = expert.qualifications?.length
    ? expert.qualifications
    : (expert.education ?? '').trim()
      ? [{ title: (expert.education ?? '').trim(), place: '' }]
      : [];
  const open = openDates(availability.data?.dates);
  const next = open[0];
  const nextTimes = next ? next.slots.filter((slot) => !slot.booked).length : 0;
  const footerHeight = 84 + Math.max(insets.bottom, 12);
  const stacked = frame < 400;

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'reviews', label: reviews.length ? `Reviews (${reviews.length})` : 'Reviews' },
    { id: 'qualifications', label: 'Qualifications' },
  ];

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={{ paddingBottom: footerHeight + 16 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { height: heroHeight }]}>
          <BrandGradient colors={[expertTint(expert.id), brand.plumSoft, brand.pearl]} angle={180} style={StyleSheet.absoluteFill} />
          <View style={[styles.frame, styles.heroFrame, { width: frame }]}>
            <RemoteImage
              uri={photo}
              label={`Photo of ${expert.name}`}
              background="transparent"
              fallback={
                <View style={styles.heroFallback}>
                  <View style={styles.heroInitials}>
                    <Text style={styles.heroInitialsText}>{expertInitials(expert.name)}</Text>
                  </View>
                </View>
              }
              style={StyleSheet.absoluteFill}
            />
            {open.length ? (
              <View style={styles.available}>
                <View style={styles.availableDot} />
                <Text style={styles.availableText}>Available for sessions</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.frame, styles.body, { width: frame }]}>
          <View style={styles.identity}>
            <View style={styles.nameRow}>
              <Text style={styles.name} accessibilityRole="header">
                {expert.name}
              </Text>
              {expert.verified ? (
                <View style={styles.verified} accessibilityLabel="Approved expert">
                  <Ionicons name="checkmark" size={13} color={brand.white} />
                </View>
              ) : null}
            </View>
            {role ? <Text style={styles.role}>{role}</Text> : null}
            {rated || experience ? (
              <View style={styles.facts}>
                {rated ? (
                  <View style={styles.fact}>
                    <Ionicons name="star" size={14} color="#E0A106" />
                    <Text style={styles.factText}>
                      {expert.rating?.toFixed(1)} ({expert.review_count} {expert.review_count === 1 ? 'review' : 'reviews'})
                    </Text>
                  </View>
                ) : null}
                {experience ? (
                  <View style={styles.fact}>
                    <Ionicons name="briefcase-outline" size={14} color={brand.plum} />
                    <Text style={styles.factText}>{experience} experience</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            {price ? (
              <Text style={styles.price}>
                {price} <Text style={styles.priceSuffix}>/ session</Text>
              </Text>
            ) : null}
            {chips.length ? <Chips items={chips.slice(0, 8)} /> : null}
            {expert.quote ? (
              <View style={styles.quote}>
                <Ionicons name="chatbox-ellipses-outline" size={16} color={brand.plum} />
                <Text style={styles.quoteText}>“{expert.quote}”</Text>
              </View>
            ) : null}
          </View>

          <View style={stacked ? styles.trustStacked : styles.trust}>
            {expert.verified ? (
              <TrustCard stacked={stacked} icon="shield-checkmark" tint="#0E9F6E" wash="#E8F7F0" title="Verified Expert" body="Profile approved" />
            ) : null}
            <TrustCard stacked={stacked} icon="lock-closed" tint="#2F6FDE" wash="#EAF1FD" title="Safe & Private" body="Booked through your YuktiOne account" />
            <TrustCard
              stacked={stacked}
              icon="star"
              tint="#C98A04"
              wash="#FDF5E2"
              title={rated ? `${expert.rating?.toFixed(1)} rating` : 'No reviews yet'}
              body={rated ? `From ${expert.review_count} approved ${expert.review_count === 1 ? 'review' : 'reviews'}` : 'Approved reviews will appear here'}
            />
          </View>

          {availability.isLoading ? (
            <Skeleton style={{ width: '100%', height: 74, borderRadius: 20 }} />
          ) : next ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Next available ${shortDate(next.date)}, ${nextTimes} open times. See all times`}
              onPress={() => openBooking(expert.id)}
              style={({ pressed }) => [styles.nextCard, pressed && styles.pressed]}
            >
              <View style={styles.nextIcon}>
                <Ionicons name="calendar" size={20} color={brand.white} />
              </View>
              <View style={styles.flexFill}>
                <Text style={styles.nextLabel}>Next available</Text>
                <Text style={styles.nextValue}>
                  {shortDate(next.date)} · {nextTimes} {nextTimes === 1 ? 'slot' : 'slots'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={brand.plum} />
            </Pressable>
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
            accessibilityRole="tablist"
          >
            {tabs.map((item) => {
              const on = item.id === tab;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setTab(item.id)}
                  style={({ pressed }) => [styles.tab, on && styles.tabOn, pressed && styles.pressed]}
                >
                  <Text style={[styles.tabText, on && styles.tabTextOn]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {tab === 'about' ? (
            <>
              <AboutSection expert={expert} experience={experience} />
              <Section title="Session plans">
                {rates.length ? <PlanList rates={rates} /> : <Empty text="No session plans are published yet." />}
              </Section>
              <Section title="Specialisations & areas I support">
                {chips.length ? <Chips items={chips} /> : <Empty text="No specialisations have been added." />}
              </Section>
              <Section title="Qualifications & experience">
                {qualifications.length ? <QualificationList items={qualifications} /> : <Empty text="No qualifications have been added." />}
              </Section>
            </>
          ) : null}

          {tab === 'services' ? (
            <Section title="Services">
              {expert.service_description ? <Text style={styles.bodyText}>{expert.service_description}</Text> : null}
              {rates.length ? <PlanList rates={rates} showTotal /> : <Empty text="No services are published for booking yet." />}
              {rates.length ? (
                <Pressable accessibilityRole="button" onPress={() => openBooking(expert.id)} hitSlop={8}>
                  <Text style={styles.link}>Choose a plan and time</Text>
                </Pressable>
              ) : null}
            </Section>
          ) : null}

          {tab === 'reviews' ? (
            <Section title="Reviews">
              {reviews.length ? (
                <>
                  {rated ? (
                    <View style={styles.ratingSummary}>
                      <Text style={styles.ratingBig}>{expert.rating?.toFixed(1)}</Text>
                      <View style={styles.flexFill}>
                        <Stars value={expert.rating ?? 0} size={16} />
                        <Text style={styles.ratingCount}>
                          {expert.review_count} approved {expert.review_count === 1 ? 'review' : 'reviews'}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </>
              ) : (
                <Empty text="No approved reviews yet." />
              )}
            </Section>
          ) : null}

          {tab === 'qualifications' ? (
            <Section title="Qualifications">
              {qualifications.length ? <QualificationList items={qualifications} /> : <Empty text="No qualifications have been added." />}
              {experience ? <Text style={styles.bodyText}>Experience: {experience}</Text> : null}
            </Section>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={[styles.frame, styles.footerRow]}>
          {price ? (
            <View style={styles.footerPrice}>
              <Text style={styles.footerFrom}>Starting from</Text>
              <Text style={styles.footerAmount}>
                {price} <Text style={styles.priceSuffix}>/ session</Text>
              </Text>
            </View>
          ) : null}
          <View style={styles.flexFill}>
            <PrimaryButton
              label="Book a session"
              icon="calendar"
              onPress={() => openBooking(expert.id)}
              accessibilityHint="Choose a plan, dates and times, then pay securely"
            />
          </View>
        </View>
      </View>

      {topBar}
    </View>
  );
}

function uniqueServices(expert: ApiExpert): string[] {
  return Array.from(new Map(expert.services.map((item) => [item.trim().toLowerCase(), item.trim()])).values()).filter(Boolean);
}

function AboutSection({ expert, experience }: { expert: ApiExpert; experience: string }) {
  const [open, setOpen] = useState(false);
  const bio = (expert.bio ?? '').trim();
  const long = bio.length > BIO_PREVIEW;
  const specialization = (expert.specialization ?? '').trim();
  return (
    <Section title="About Me">
      <Text style={styles.bodyText} numberOfLines={long && !open ? 6 : undefined}>
        {bio || 'This expert has not added a biography yet.'}
      </Text>
      {long ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? 'Show less' : 'Read more about this expert'}
          onPress={() => setOpen((value) => !value)}
          hitSlop={8}
        >
          <Text style={styles.link}>{open ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      ) : null}
      {experience || specialization ? (
        <View style={styles.stats}>
          {experience ? <Stat value={experience} label="Experience" /> : null}
          {specialization ? <Stat value={specialization} label="Specialisation" /> : null}
        </View>
      ) : null}
    </Section>
  );
}

function PlanList({ rates, showTotal }: { rates: ApiSessionRate[]; showTotal?: boolean }) {
  return (
    <View style={styles.list}>
      {rates.map((rate) => {
        const perSession = formatPrice(rate.rate_per_session);
        const total = formatPrice(rate.final_rate);
        const meta = [
          sessionsLabel(rate.num_sessions),
          showTotal ? (total ? `${total} total` : null) : perSession ? `${perSession} per session` : null,
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <View key={rate.id} style={styles.rate}>
            <View style={styles.rowIcon}>
              <Ionicons name={showTotal ? 'list-outline' : 'calendar-outline'} size={18} color={brand.plum} />
            </View>
            <View style={styles.flexFill}>
              <Text style={styles.rateTitle}>{planTitle(rate)}</Text>
              <Text style={styles.rateMeta}>{meta}</Text>
              {rate.features?.length ? <Text style={styles.rateMeta}>{rate.features.join(' · ')}</Text> : null}
            </View>
            {rate.final_rate > 0 ? <Text style={styles.rateTotal}>{rupees(rate.final_rate)}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function QualificationList({ items }: { items: { title: string; place: string }[] }) {
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={`${item.title}-${item.place}`} style={styles.qual}>
          <View style={styles.rowIcon}>
            <Ionicons name="school-outline" size={18} color={brand.plum} />
          </View>
          <View style={styles.flexFill}>
            <Text style={styles.rateTitle}>{item.title}</Text>
            {item.place ? <Text style={styles.rateMeta}>{item.place}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: ApiExpertReview }) {
  const date = review.created_at
    ? new Date(`${review.created_at}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  return (
    <View style={styles.review}>
      <View style={styles.reviewHead}>
        <Stars value={review.rating} size={14} />
        <Text style={styles.reviewScore}>{review.rating.toFixed(1)} / 5</Text>
        {date ? <Text style={styles.reviewDate}>{date}</Text> : null}
      </View>
      {review.text ? <Text style={styles.bodyText}>{review.text}</Text> : null}
    </View>
  );
}

function Stars({ value, size }: { value: number; size: number }) {
  return (
    <View style={styles.stars} accessibilityLabel={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={value >= star ? 'star' : value >= star - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color="#E0A106"
        />
      ))}
    </View>
  );
}

function TrustCard({
  stacked,
  icon,
  tint,
  wash,
  title,
  body,
}: {
  stacked: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  wash: string;
  title: string;
  body: string;
}) {
  if (stacked) {
    return (
      <View style={styles.trustRow}>
        <View style={[styles.trustIcon, { backgroundColor: wash }]}>
          <Ionicons name={icon} size={18} color={tint} />
        </View>
        <View style={styles.flexFill}>
          <Text style={styles.trustTitle}>{title}</Text>
          <Text style={styles.trustBody}>{body}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.trustCard}>
      <View style={[styles.trustIcon, { backgroundColor: wash }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.trustTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.trustBody} numberOfLines={4}>
        {body}
      </Text>
    </View>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <View style={styles.chips}>
      {items.map((item) => (
        <Text key={item} style={styles.chip}>
          {item}
        </Text>
      ))}
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.round, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={22} color={brand.ink} />
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: customer.canvas },
  centerPage: { paddingHorizontal: 16 },
  frame: { alignSelf: 'center', maxWidth: '100%' },
  flexFill: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.8 },

  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  round: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    ...shadows.sm,
  },

  hero: { width: '100%', overflow: 'hidden' },
  heroFrame: { flex: 1 },
  heroFallback: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  heroInitials: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.white,
    ...shadows.md,
  },
  heroInitialsText: { fontFamily: customerFonts.bold, fontSize: 52, color: brand.plum, letterSpacing: 1 },
  available: {
    position: 'absolute',
    left: 16,
    bottom: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...shadows.sm,
  },
  availableDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#12B76A' },
  availableText: { fontFamily: customerFonts.semibold, fontSize: 12.5, color: brand.ink },

  body: { paddingHorizontal: 16, gap: 14, marginTop: -36 },
  identity: {
    gap: 6,
    padding: 18,
    borderRadius: 24,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: '#F3E6ED',
    ...shadows.md,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontFamily: customerFonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: brand.ink },
  verified: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12B76A',
  },
  role: { fontFamily: customerFonts.medium, fontSize: 15, lineHeight: 21, color: '#3D3D4A' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4, marginTop: 2 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  factText: { fontFamily: customerFonts.semibold, fontSize: 13, color: brand.ink },
  price: { fontFamily: customerFonts.bold, fontSize: 18, color: brand.plum, marginTop: 4 },
  priceSuffix: { fontFamily: customerFonts.regular, fontSize: 13, color: brand.grey },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    fontFamily: customerFonts.medium,
    fontSize: 12.5,
    color: brand.plum,
    backgroundColor: brand.plumSoft,
    borderWidth: 1,
    borderColor: brand.plumSoftDeep,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  quote: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FBF5F8',
    borderLeftWidth: 3,
    borderLeftColor: brand.plum,
  },
  quoteText: { flex: 1, fontFamily: customerFonts.medium, fontStyle: 'italic', fontSize: 14, lineHeight: 21, color: '#3D3D4A' },

  trust: { flexDirection: 'row', gap: 8 },
  trustStacked: {
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trustCard: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    padding: 12,
    borderRadius: 18,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  trustIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  trustTitle: { fontFamily: customerFonts.bold, fontSize: 13, lineHeight: 17, color: brand.ink },
  trustBody: { fontFamily: customerFonts.regular, fontSize: 11.5, lineHeight: 15, color: brand.grey },

  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: brand.plumSoft,
    borderWidth: 1,
    borderColor: brand.plumSoftDeep,
  },
  nextIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.plum,
  },
  nextLabel: { fontFamily: customerFonts.medium, fontSize: 12, color: brand.grey },
  nextValue: { fontFamily: customerFonts.bold, fontSize: 14.5, color: brand.ink },
  tabs: { gap: 8, paddingVertical: 2 },
  tab: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  tabOn: { backgroundColor: brand.plum, borderColor: brand.plum },
  tabText: { fontFamily: customerFonts.semibold, fontSize: 13.5, color: '#3D3D4A' },
  tabTextOn: { color: brand.white },

  section: {
    gap: 12,
    padding: 18,
    borderRadius: 22,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  sectionTitle: { fontFamily: customerFonts.bold, fontSize: 17, color: brand.ink },
  bodyText: { fontFamily: customerFonts.regular, fontSize: 14.5, lineHeight: 22, color: '#3D3D4A' },
  empty: { fontFamily: customerFonts.regular, fontSize: 14, lineHeight: 20, color: brand.grey },
  link: { fontFamily: customerFonts.semibold, fontSize: 14, color: brand.plum },
  stats: { flexDirection: 'row', gap: 10, marginTop: 2 },
  stat: { flex: 1, minWidth: 0, padding: 12, borderRadius: 16, backgroundColor: brand.pearl, borderWidth: 1, borderColor: brand.divider, gap: 2 },
  statValue: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.ink },
  statLabel: { fontFamily: customerFonts.regular, fontSize: 12, color: brand.grey },

  list: { gap: 12 },
  rate: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.plumSoft,
  },
  rateTitle: { fontFamily: customerFonts.semibold, fontSize: 14.5, color: brand.ink },
  rateMeta: { fontFamily: customerFonts.regular, fontSize: 12.5, lineHeight: 18, color: brand.grey },
  rateTotal: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.plum },
  qual: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FDF8EC',
  },
  ratingBig: { fontFamily: customerFonts.bold, fontSize: 32, color: brand.ink },
  ratingCount: { fontFamily: customerFonts.regular, fontSize: 12.5, color: brand.grey, marginTop: 2 },
  stars: { flexDirection: 'row', gap: 2 },
  review: { gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: brand.divider },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  reviewScore: { fontFamily: customerFonts.bold, fontSize: 13, color: brand.ink },
  reviewDate: { marginLeft: 'auto', fontFamily: customerFonts.regular, fontSize: 12, color: brand.grey },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: brand.white,
    borderTopWidth: 1,
    borderTopColor: brand.divider,
    ...shadows.md,
  },
  footerRow: { width: '100%', maxWidth: MAX_FRAME - 32, flexDirection: 'row', alignItems: 'center', gap: 14 },
  footerPrice: { gap: 1 },
  footerFrom: { fontFamily: customerFonts.regular, fontSize: 12, color: brand.grey },
  footerAmount: { fontFamily: customerFonts.bold, fontSize: 18, color: brand.ink },
});
