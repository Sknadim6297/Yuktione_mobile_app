import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EXPERT_SPECIALTIES,
  SESSION_TYPES,
  TIME_SLOTS,
  addDays,
  formatDayChip,
  formatInr,
  formatMonthYear,
  formatWeekdayDate,
  startOfWeek,
  toIsoDate,
  type SessionTypeId,
} from '@/features/customer/content';
import {
  mapExpertCard,
  type LiveExpertCard,
} from '@/features/customer/liveCatalog';
import { requestBookingPayment, type PaymentMethodId } from '@/features/customer/payments';
import {
  customerActions,
  latestBooking,
  useCustomerState,
  type Booking,
} from '@/features/customer/store';
import {
  ChipRow,
  CustomerPage,
  Heading,
  IconButton,
  OutlineButton,
  SearchField,
  SectionTitle,
  Subtitle,
  TealButton,
} from '@/features/customer/ui';
import { isApiConfigured } from '@/constants/config';
import { FRONTEND_ONLY } from '@/constants/frontendOnly';
import { fetchExpert, fetchExperts } from '@/services/api/catalog';
import { customer, customerFonts } from '@/theme';

function ExpertRow({
  expert,
  onBook,
}: {
  expert: LiveExpertCard;
  onBook?: () => void;
}) {
  return (
    <Pressable
      style={styles.expertCard}
      onPress={() => router.push({ pathname: '/experts/profile/[id]', params: { id: expert.id } })}
    >
      <View style={[styles.avatar, { backgroundColor: expert.tint }]}>
        <Text style={styles.avatarText}>{expert.initials}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.name}>
          {expert.name} {expert.verified ? '✓' : ''}
        </Text>
        <Text style={styles.meta}>{expert.title}</Text>
        <Text style={styles.meta}>
          {expert.rating > 0 ? `★ ${expert.rating} (${expert.reviews} reviews) · ` : ''}
          {expert.experience}
        </Text>
      </View>
      <View style={styles.expertSide}>
        <Text style={styles.specialty}>{expert.specialty}</Text>
        <Pressable style={styles.bookNow} onPress={onBook ?? (() => router.push({ pathname: '/booking/[expertId]', params: { expertId: expert.id } }))}>
          <Text style={styles.bookNowText}>Book Now</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export function ExpertsHomeScreen() {
  const liveEnabled = !FRONTEND_ONLY && isApiConfigured();
  const expertsQuery = useQuery({
    queryKey: ['v1', 'experts', 'home'],
    queryFn: async () => {
      const result = await fetchExperts({ featured: true, limit: 12 });
      if (!result.ok) throw new Error(result.message);
      return result.experts.map(mapExpertCard);
    },
    enabled: liveEnabled,
  });
  const experts = useMemo(() => expertsQuery.data ?? [], [expertsQuery.data]);
  const specialties = useMemo(() => {
    const fromDb = Array.from(
      new Set(experts.map((expert) => expert.specialty).filter(Boolean)),
    ).slice(0, 8);
    return fromDb.length ? fromDb : EXPERT_SPECIALTIES;
  }, [experts]);

  return (
    <CustomerPage
      nav="experts"
      active="experts"
      onBack={() => router.back()}
      right={
        <>
          <IconButton icon="heart-outline" label="Favourites" onPress={() => router.push('/experts/browse')} />
          <IconButton icon="calendar-outline" label="Bookings" onPress={() => router.push('/(tabs)/bookings')} />
        </>
      }
    >
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Heading>Talk to an Expert</Heading>
          <Subtitle>Get personal guidance and support from verified experts in mental health, career, wellness and more.</Subtitle>
        </View>
      </View>
      <View style={styles.trustRow}>
        {[
          ['Verified Experts', 'shield-checkmark-outline'],
          ['Easy Booking', 'calendar-outline'],
          ['Video / Audio Sessions', 'videocam-outline'],
          ['Private & Confidential', 'lock-closed-outline'],
        ].map(([label, icon]) => (
          <View key={label} style={styles.trust}>
            <Ionicons name={icon as 'shield-checkmark-outline'} size={16} color={customer.teal} />
            <Text style={styles.trustText}>{label}</Text>
          </View>
        ))}
      </View>
      <SectionTitle title="Explore by Speciality" action="See All >" onAction={() => router.push('/experts/browse')} />
      <View style={styles.grid}>
        {specialties.map((label) => (
          <Pressable key={label} style={styles.speciality} onPress={() => router.push({ pathname: '/experts/browse', params: { specialty: label } })}>
            <Text style={styles.specialityText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <SectionTitle title="Top Experts" action="See All >" onAction={() => router.push('/experts/browse')} />
      {expertsQuery.isLoading ? <ActivityIndicator color={customer.teal} /> : null}
      {expertsQuery.isError ? <Text style={styles.meta}>{expertsQuery.error.message}</Text> : null}
      {experts.map((expert) => (
        <ExpertRow key={expert.id} expert={expert} />
      ))}
      {!expertsQuery.isLoading && experts.length === 0 ? (
        <Text style={styles.meta}>No accepted experts are available right now.</Text>
      ) : null}
      <View style={styles.promo}>
        <Text style={styles.promoTitle}>Not sure which expert to choose?</Text>
        <Text style={styles.meta}>Get a quick recommendation based on your needs and goals.</Text>
        <TealButton label="Find My Expert" icon="sparkles-outline" onPress={() => router.push('/experts/browse')} />
      </View>
    </CustomerPage>
  );
}

export function ExpertsBrowseScreen() {
  const params = useLocalSearchParams<{ specialty?: string }>();
  const initial = typeof params.specialty === 'string' ? params.specialty : '';
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState(initial || 'All');
  const [sort, setSort] = useState<'recommended' | 'rating' | 'reviews'>('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>(initial ? [initial] : []);
  const [experience, setExperience] = useState('Any');
  const [availability, setAvailability] = useState('Any Time');
  const activeFilters = (specialties.length ? 1 : 0) + (experience !== 'Any' ? 1 : 0);
  const liveEnabled = !FRONTEND_ONLY && isApiConfigured();

  const expertsQuery = useQuery({
    queryKey: ['v1', 'experts', 'browse', query, chip, specialties.join('|')],
    queryFn: async () => {
      const specialty =
        chip !== 'All' ? chip : specialties[0] ? specialties[0] : undefined;
      const result = await fetchExperts({
        q: query.trim() || undefined,
        specialty,
        limit: 40,
      });
      if (!result.ok) throw new Error(result.message);
      return result.experts.map(mapExpertCard);
    },
    enabled: liveEnabled,
  });

  const experts = useMemo(() => {
    const list = [...(expertsQuery.data ?? [])];
    return list.sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'reviews') return b.reviews - a.reviews;
      return b.rating - a.rating;
    });
  }, [expertsQuery.data, sort]);

  return (
    <CustomerPage
      onBack={() => router.back()}
      right={
        <>
          <IconButton icon="heart-outline" label="Favourites" onPress={() => setFiltersOpen(true)} />
          <IconButton icon="calendar-outline" label="Bookings" onPress={() => router.push('/(tabs)/bookings')} />
        </>
      }
    >
      <Heading>Experts</Heading>
      <Subtitle>Find verified experts and get personalised support for your goals.</Subtitle>
      <SearchField value={query} onChangeText={setQuery} placeholder="Search experts by name, specialty or topic..." />
      <ChipRow
        options={['All', 'Mental Health', 'Career', 'Health', 'Lifestyle'].map((label) => ({
          id: label,
          label: label === 'All' && activeFilters ? `Filters · ${activeFilters}` : label,
          icon: label === 'All' ? 'options-outline' : undefined,
        }))}
        value={chip}
        onChange={(value) => {
          if (value === 'All' && chip === 'All') setFiltersOpen(true);
          setChip(value);
        }}
      />
      <View style={styles.sectionRow}>
        <Text style={styles.meta}>{experts.length} Experts Found</Text>
        <Pressable onPress={() => setSort(sort === 'recommended' ? 'rating' : sort === 'rating' ? 'reviews' : 'recommended')}>
          <Text style={styles.link}>Sort: {sort[0]?.toUpperCase()}{sort.slice(1)} ▾</Text>
        </Pressable>
      </View>
      {experts.length === 0 ? <Text style={styles.meta}>No experts match those filters.</Text> : null}
      {experts.map((expert) => (
        <ExpertRow key={expert.id} expert={expert} />
      ))}
      <Text style={styles.meta}>Availability filter “{availability}” is saved on this screen. Live slots still come from each expert’s booking page.</Text>
      <FilterSheet
        key={`${specialties.join('|')}-${experience}-${availability}-${String(filtersOpen)}`}
        visible={filtersOpen}
        specialties={specialties}
        experience={experience}
        availability={availability}
        onClose={() => setFiltersOpen(false)}
        onReset={() => {
          setSpecialties([]);
          setExperience('Any');
          setAvailability('Any Time');
        }}
        onApply={(next) => {
          setSpecialties(next.specialties);
          setExperience(next.experience);
          setAvailability(next.availability);
          setFiltersOpen(false);
        }}
      />
    </CustomerPage>
  );
}

function FilterSheet({
  visible,
  specialties,
  experience,
  availability,
  onClose,
  onReset,
  onApply,
}: {
  visible: boolean;
  specialties: string[];
  experience: string;
  availability: string;
  onClose: () => void;
  onReset: () => void;
  onApply: (value: { specialties: string[]; experience: string; availability: string }) => void;
}) {
  const insets = useSafeAreaInsets();
  const [localSpecialties, setLocalSpecialties] = useState(specialties);
  const [localExperience, setLocalExperience] = useState(experience);
  const [localAvailability, setLocalAvailability] = useState(availability);
  const count = localSpecialties.length + (localExperience === 'Any' ? 0 : 1);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.sectionRow}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <Pressable onPress={onReset}><Text style={styles.link}>Reset</Text></Pressable>
          </View>
          <Text style={styles.name}>Specialty</Text>
          <View style={styles.wrap}>
            {EXPERT_SPECIALTIES.map((item) => {
              const on = localSpecialties.includes(item);
              return (
                <Pressable
                  key={item}
                  style={[styles.choice, on && styles.choiceOn]}
                  onPress={() =>
                    setLocalSpecialties((current) =>
                      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
                    )
                  }
                >
                  <Text style={styles.choiceText}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.name}>Experience</Text>
          <View style={styles.wrap}>
            {['Any', '0 – 2 years', '3 – 5 years', '6 – 10 years', '10+ years'].map((item) => (
              <Pressable key={item} style={[styles.choice, localExperience === item && styles.choiceOn]} onPress={() => setLocalExperience(item)}>
                <Text style={[styles.choiceText, localExperience === item && styles.choiceTextOn]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.name}>Availability</Text>
          <View style={styles.wrap}>
            {['Any Time', 'Today', 'This Week', 'Custom'].map((item) => (
              <Pressable key={item} style={[styles.choice, localAvailability === item && styles.choiceOn]} onPress={() => setLocalAvailability(item)}>
                <Text style={styles.choiceText}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <TealButton
            label={`Apply Filters (${count})`}
            onPress={() => onApply({ specialties: localSpecialties, experience: localExperience, availability: localAvailability })}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ExpertProfileScreen({ id }: { id: string }) {
  const state = useCustomerState();
  const [session, setSession] = useState<SessionTypeId>('video');
  const [aboutOpen, setAboutOpen] = useState(false);
  const liveEnabled = !FRONTEND_ONLY && isApiConfigured();
  const expertQuery = useQuery({
    queryKey: ['v1', 'experts', id],
    queryFn: async () => {
      const result = await fetchExpert(id);
      if (!result.ok) throw new Error(result.message);
      return mapExpertCard(result.expert);
    },
    enabled: liveEnabled && Boolean(id),
  });
  const expert = expertQuery.data;
  if (expertQuery.isLoading) {
    return (
      <CustomerPage onBack={() => router.back()}>
        <ActivityIndicator color={customer.teal} />
      </CustomerPage>
    );
  }
  if (!expert) {
    return (
      <CustomerPage onBack={() => router.back()}>
        <Heading>Expert</Heading>
        <Subtitle>{expertQuery.error?.message ?? 'This profile is not available.'}</Subtitle>
      </CustomerPage>
    );
  }
  const favourite = state.favouriteExpertIds.includes(expert.id);
  const areas = (expert.services.length ? expert.services : [expert.specialty]).filter(Boolean);
  const about =
    expert.bio ||
    expert.education ||
    `${expert.name} is a YuktiOne expert${expert.specialty ? ` in ${expert.specialty}` : ''}.`;
  return (
    <CustomerPage
      onBack={() => router.back()}
      right={
        <>
          <IconButton icon={favourite ? 'heart' : 'heart-outline'} label="Favourite" onPress={() => customerActions.toggleFavouriteExpert(expert.id)} />
          <IconButton icon="share-social-outline" label="Share" onPress={() => Alert.alert(expert.name, expert.title)} />
        </>
      }
      footer={
        <View style={styles.footerRow}>
          <Pressable style={styles.chatFab} onPress={() => Alert.alert('Chat', 'In-app chat opens after a paid session is confirmed by the server.')}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={customer.teal} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <TealButton label="Book a Session" icon="calendar-outline" onPress={() => router.push({ pathname: '/booking/[expertId]', params: { expertId: expert.id, session } })} />
          </View>
        </View>
      }
    >
      <View style={styles.profileTop}>
        <View style={[styles.avatarLarge, { backgroundColor: expert.tint }]}>
          <Text style={styles.avatarText}>{expert.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{expert.name} {expert.verified ? '✓' : ''}</Text>
          <Text style={styles.meta}>{expert.title}</Text>
          <Text style={styles.meta}>
            {expert.rating > 0 ? `★ ${expert.rating} (${expert.reviews} reviews) · ` : ''}
            {expert.experience}
          </Text>
        </View>
      </View>
      <View style={styles.trustRow}>
        {expert.verified ? <Text style={styles.trust}>Verified Expert</Text> : null}
        <Text style={styles.trust}>Online Sessions</Text>
      </View>
      <Text style={styles.sheetTitle}>About Me</Text>
      <Text style={styles.body} numberOfLines={aboutOpen ? undefined : 3}>{about}</Text>
      <Pressable onPress={() => setAboutOpen((value) => !value)}><Text style={styles.link}>{aboutOpen ? 'Show less' : 'Read More'}</Text></Pressable>
      <Text style={styles.sheetTitle}>Areas of Expertise</Text>
      <View style={styles.grid}>
        {areas.map((label) => (
          <View key={label} style={[styles.area, { backgroundColor: expert.tint }]}>
            <Ionicons name="leaf-outline" size={18} color={customer.teal} />
            <Text style={styles.areaText}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sheetTitle}>Session Options</Text>
      <View style={styles.sessionRow}>
        {(expert.sessionRates.length
          ? expert.sessionRates.map((rate) => ({
              id: rate.session_type.toLowerCase().includes('audio')
                ? ('audio' as const)
                : rate.session_type.toLowerCase().includes('chat')
                  ? ('chat' as const)
                  : ('video' as const),
              title: rate.session_type,
              detail: `${rate.duration} · ${formatInr(rate.final_rate)}`,
              icon: 'videocam-outline' as const,
            }))
          : SESSION_TYPES
        ).map((option) => {
          const selected = session === option.id;
          return (
            <Pressable key={`${option.id}-${option.title}`} style={[styles.session, selected && styles.sessionOn]} onPress={() => setSession(option.id)}>
              <Ionicons name={option.icon} size={18} color={customer.teal} />
              <Text style={styles.choiceText}>{option.title}</Text>
              <Text style={styles.meta}>{option.detail}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.feeRow}>
        <Text style={styles.name}>
          Starting from {formatInr(expert.fee > 0 ? expert.fee : 0)} / session
        </Text>
        <Pressable onPress={() => router.push({ pathname: '/booking/[expertId]', params: { expertId: expert.id } })}><Text style={styles.link}>View Plans</Text></Pressable>
      </View>
      <SectionTitle title={`Reviews (${expert.reviews})`} />
      <Text style={styles.meta}>
        {expert.reviews > 0
          ? 'Approved review scores are shown above. Written review text is not exposed on this mobile endpoint yet.'
          : 'No approved reviews are stored for this profile yet.'}
      </Text>
      <Text style={styles.meta}>Portrait photos use website storage when available; otherwise initials are shown.</Text>
    </CustomerPage>
  );
}

export function BookSessionScreen({ expertId, initialSession }: { expertId: string; initialSession?: string }) {
  const liveEnabled = !FRONTEND_ONLY && isApiConfigured();
  const expertQuery = useQuery({
    queryKey: ['v1', 'experts', expertId],
    queryFn: async () => {
      const result = await fetchExpert(expertId);
      if (!result.ok) throw new Error(result.message);
      return mapExpertCard(result.expert);
    },
    enabled: liveEnabled && Boolean(expertId),
  });
  const expert = expertQuery.data;
  const [session, setSession] = useState<SessionTypeId>(initialSession === 'audio' || initialSession === 'chat' ? initialSession : 'video');
  const [anchor, setAnchor] = useState(new Date());
  const week = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, index) => addDays(week, index));
  const [date, setDate] = useState(toIsoDate(new Date()));
  const [time, setTime] = useState<string>(TIME_SLOTS[0] ?? '10:00 AM');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | undefined>();
  if (expertQuery.isLoading) {
    return (
      <CustomerPage onBack={() => router.back()}>
        <ActivityIndicator color={customer.teal} />
      </CustomerPage>
    );
  }
  if (!expert) {
    return (
      <CustomerPage onBack={() => router.back()}>
        <Heading>Booking</Heading>
        <Subtitle>{expertQuery.error?.message ?? 'Expert not found.'}</Subtitle>
      </CustomerPage>
    );
  }
  const chosen = SESSION_TYPES.find((item) => item.id === session) ?? SESSION_TYPES[0]!;
  const confirm = () => {
    if (!time) {
      setError('Choose a time slot.');
      return;
    }
    const booking = customerActions.createBooking({
      expertId: expert.id,
      sessionType: session,
      date,
      time,
      note: note.trim(),
      fee: chosen.price,
    });
    router.push({ pathname: '/booking/payment', params: { bookingId: booking.id } });
  };
  return (
    <CustomerPage
      onBack={() => router.back()}
      footer={<TealButton label="Confirm Booking" icon="calendar-outline" onPress={confirm} />}
    >
      <Heading>Book a Session</Heading>
      <Subtitle>Choose your preferred session type, date and time with {expert.name}.</Subtitle>
      <ExpertRow expert={expert} onBook={() => undefined} />
      <Text style={styles.sheetTitle}>1  Select Session Type</Text>
      <View style={styles.sessionRow}>
        {SESSION_TYPES.map((option) => (
          <Pressable key={option.id} style={[styles.session, session === option.id && styles.sessionOn]} onPress={() => setSession(option.id)}>
            <Ionicons name={option.icon} size={18} color={customer.teal} />
            <Text style={styles.choiceText}>{option.title}</Text>
            <Text style={styles.meta}>{formatInr(option.price)}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sectionRow}>
        <Text style={styles.sheetTitle}>2  Choose Date</Text>
        <View style={styles.monthNav}>
          <Pressable onPress={() => setAnchor(addDays(anchor, -7))}><Ionicons name="chevron-back" size={18} color={customer.teal} /></Pressable>
          <Text style={styles.meta}>{formatMonthYear(anchor)}</Text>
          <Pressable onPress={() => setAnchor(addDays(anchor, 7))}><Ionicons name="chevron-forward" size={18} color={customer.teal} /></Pressable>
        </View>
      </View>
      <View style={styles.days}>
        {days.map((day) => {
          const iso = toIsoDate(day);
          const chip = formatDayChip(day);
          const selected = iso === date;
          return (
            <Pressable key={iso} style={[styles.day, selected && styles.dayOn]} onPress={() => setDate(iso)}>
              <Text style={[styles.meta, selected && styles.onText]}>{chip.weekday}</Text>
              <Text style={[styles.name, selected && styles.onText]}>{chip.day}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.sheetTitle}>3  Select Time Slot</Text>
      <Text style={styles.meta}>Available slots ({formatWeekdayDate(date)}). These are the published preview times, not a live availability response.</Text>
      <View style={styles.wrap}>
        {TIME_SLOTS.map((slot) => (
          <Pressable key={slot} style={[styles.choice, time === slot && styles.choiceOn]} onPress={() => setTime(slot)}>
            <Text style={[styles.choiceText, time === slot && styles.choiceTextOn]}>{slot}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.sheetTitle}>4  Add a Note (Optional)</Text>
      <TextInput
        value={note}
        onChangeText={(value) => setNote(value.slice(0, 300))}
        multiline
        placeholder="Tell us briefly about what you'd like to discuss"
        placeholderTextColor={customer.muted}
        style={styles.note}
      />
      <Text style={styles.meta}>{note.length} / 300</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.feeRow}>
        <Text style={styles.name}>Session Fee ({chosen.title})</Text>
        <Text style={styles.name}>{formatInr(chosen.price)}</Text>
      </View>
    </CustomerPage>
  );
}

const METHODS: { id: PaymentMethodId; title: string; detail: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'upi', title: 'UPI (Recommended)', detail: 'Google Pay, PhonePe, Paytm and more', icon: 'qr-code-outline' },
  { id: 'card', title: 'Debit / Credit Card', detail: 'Visa, Mastercard, RuPay and more', icon: 'card-outline' },
  { id: 'netbanking', title: 'Net Banking', detail: 'All major banks supported', icon: 'business-outline' },
  { id: 'wallet', title: 'Wallet', detail: 'Paytm, Amazon Pay, Mobikwik and more', icon: 'wallet-outline' },
];

export function PaymentScreen({ bookingId }: { bookingId?: string }) {
  const state = useCustomerState();
  const booking = state.bookings.find((item) => item.id === bookingId) ?? latestBooking();
  const expertQuery = useQuery({
    queryKey: ['v1', 'experts', booking?.expertId],
    queryFn: async () => {
      const result = await fetchExpert(booking!.expertId);
      if (!result.ok) throw new Error(result.message);
      return mapExpertCard(result.expert);
    },
    enabled: Boolean(booking?.expertId) && !FRONTEND_ONLY && isApiConfigured(),
  });
  const expert = expertQuery.data;
  const [method, setMethod] = useState<PaymentMethodId>('upi');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  if (!booking || !expert) {
    return (
      <CustomerPage onBack={() => router.back()}>
        <Heading>Complete Payment</Heading>
        <Subtitle>Choose a session before paying. Nothing has been charged.</Subtitle>
        <TealButton label="Find an expert" onPress={() => router.replace('/(tabs)/experts')} />
      </CustomerPage>
    );
  }
  const pay = async () => {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    const attempt = await requestBookingPayment({
      bookingId: booking.id,
      amount: booking.fee,
      method,
    });
    customerActions.setBookingPayment(booking.id, attempt);
    setBusy(false);
    if (attempt.state === 'paid') {
      router.replace({ pathname: '/booking/confirmed', params: { bookingId: booking.id } });
      return;
    }
    setError(attempt.message);
    router.replace({ pathname: '/booking/confirmed', params: { bookingId: booking.id } });
  };
  const session = SESSION_TYPES.find((item) => item.id === booking.sessionType);
  return (
    <CustomerPage
      onBack={() => router.back()}
      footer={<TealButton label={busy ? 'Checking payment…' : `Pay Now ${formatInr(booking.fee)}`} icon="lock-closed-outline" onPress={() => void pay()} disabled={busy} />}
    >
      <Heading>Complete Payment</Heading>
      <Subtitle>Pay securely to confirm your session booking.</Subtitle>
      <View style={styles.expertCard}>
        <View style={[styles.avatar, { backgroundColor: expert.tint }]}><Text style={styles.avatarText}>{expert.initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{expert.name}</Text>
          <Text style={styles.meta}>{session?.title} · {formatWeekdayDate(booking.date)} · {booking.time} IST</Text>
        </View>
      </View>
      <Text style={styles.sheetTitle}>Price Details</Text>
      <View style={styles.feeRow}><Text style={styles.meta}>Session fee</Text><Text style={styles.name}>{formatInr(booking.fee)}</Text></View>
      <View style={styles.feeRow}><Text style={styles.meta}>Platform fee</Text><Text style={styles.name}>{formatInr(0)}</Text></View>
      <View style={styles.feeRow}><Text style={styles.name}>Total payable</Text><Text style={styles.name}>{formatInr(booking.fee)}</Text></View>
      <Text style={styles.sheetTitle}>Choose Payment Method</Text>
      {METHODS.map((item) => (
        <Pressable key={item.id} style={[styles.method, method === item.id && styles.sessionOn]} onPress={() => setMethod(item.id)}>
          <Ionicons name={item.icon} size={20} color={customer.teal} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.title}</Text>
            <Text style={styles.meta}>{item.detail}</Text>
          </View>
          <Ionicons name={method === item.id ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={customer.teal} />
        </Pressable>
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.meta}>100% of a real charge must be confirmed by the payments API. This screen does not mark a payment successful by itself.</Text>
    </CustomerPage>
  );
}

export function BookingConfirmedScreen({ bookingId }: { bookingId?: string }) {
  const state = useCustomerState();
  const booking = state.bookings.find((item) => item.id === bookingId) ?? latestBooking();
  const expertQuery = useQuery({
    queryKey: ['v1', 'experts', booking?.expertId],
    queryFn: async () => {
      const result = await fetchExpert(booking!.expertId);
      if (!result.ok) throw new Error(result.message);
      return mapExpertCard(result.expert);
    },
    enabled: Boolean(booking?.expertId) && !FRONTEND_ONLY && isApiConfigured(),
  });
  const expert = expertQuery.data;
  if (!booking || !expert) {
    return (
      <CustomerPage onBack={() => router.back()}>
        <Heading>Booking</Heading>
        <Subtitle>
          {booking && expertQuery.isLoading
            ? 'Loading expert…'
            : 'No booking was found on this device.'}
        </Subtitle>
      </CustomerPage>
    );
  }
  const paid = booking.payment === 'paid';
  const session = SESSION_TYPES.find((item) => item.id === booking.sessionType);
  return (
    <CustomerPage onBack={() => router.replace('/(tabs)/bookings')}>
      <View style={styles.confirmIcon}><Ionicons name={paid ? 'checkmark' : 'time-outline'} size={36} color={customer.white} /></View>
      <Text style={styles.confirmTitle}>{paid ? 'Booking Confirmed!' : 'Booking saved'}</Text>
      <Text style={styles.body}>
        {paid
          ? `Your session with ${expert.name} has been successfully booked.`
          : `Your request with ${expert.name} is saved on this device. ${booking.paymentMessage}`}
      </Text>
      <View style={styles.feeRow}>
        <Text style={styles.name}>Reference {booking.id}</Text>
      </View>
      <View style={styles.expertCard}>
        <View style={[styles.avatar, { backgroundColor: expert.tint }]}><Text style={styles.avatarText}>{expert.initials}</Text></View>
        <View>
          <Text style={styles.name}>{expert.name}</Text>
          <Text style={styles.meta}>{expert.title}</Text>
        </View>
      </View>
      <View style={styles.wrap}>
        <Text style={styles.trust}>{formatWeekdayDate(booking.date)}</Text>
        <Text style={styles.trust}>{booking.time} IST</Text>
        <Text style={styles.trust}>{session?.title}</Text>
        <Text style={styles.trust}>{paid ? 'Payment successful' : 'Payment not completed'}</Text>
      </View>
      <View style={styles.sessionRow}>
        <View style={{ flex: 1 }}><TealButton label="Join Session" disabled={!paid} onPress={() => Alert.alert('Session locked', 'Join opens 5 minutes before the start time after payment is verified.')} /></View>
      </View>
      <View style={styles.sessionRow}>
        <View style={{ flex: 1 }}><OutlineButton label="Reschedule" onPress={() => router.push({ pathname: '/booking/[expertId]', params: { expertId: expert.id } })} /></View>
        <View style={{ flex: 1 }}><OutlineButton label="Cancel Booking" onPress={() => { customerActions.cancelBooking(booking.id); router.replace('/(tabs)/bookings'); }} /></View>
      </View>
      <OutlineButton
        label="Add to Calendar"
        icon="calendar-outline"
        onPress={() => {
          const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`YuktiOne session with ${expert.name}`)}&details=${encodeURIComponent(booking.paymentMessage)}`;
          void Linking.openURL(url);
        }}
      />
    </CustomerPage>
  );
}

function bookingCountdown(date: string, time: string): string | null {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return null;
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  const start = new Date(year, month - 1, day, hour, minute, 0, 0);
  const diffMs = start.getTime() - Date.now();
  if (diffMs <= 0) return 'Session time has passed on this device clock.';
  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `Your session starts in ${hours} hours ${minutes} minutes.`;
}

function BookingCard({
  booking,
  highlight,
  expert,
}: {
  booking: Booking;
  highlight?: boolean;
  expert?: LiveExpertCard;
}) {
  if (!expert) return null;
  const session = SESSION_TYPES.find((item) => item.id === booking.sessionType);
  const countdown = highlight ? bookingCountdown(booking.date, booking.time) : null;
  return (
    <View style={styles.expertCardColumn}>
      <View style={styles.profileTop}>
        <View style={[styles.avatar, { backgroundColor: expert.tint }]}>
          <Text style={styles.avatarText}>{expert.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{expert.name}{expert.verified ? ' ✓' : ''}</Text>
          <Text style={styles.meta}>{expert.title}</Text>
          {booking.sample ? <Text style={styles.sample}>Sample schedule · not a paid booking</Text> : null}
        </View>
        <Text style={styles.specialty}>{expert.specialty}</Text>
      </View>
      <Text style={styles.meta}>
        {formatWeekdayDate(booking.date)} · {booking.time} IST · {session?.title} · 60 minutes
      </Text>
      {countdown ? (
        <View style={styles.countdown}>
          <Ionicons name="notifications-outline" size={16} color={customer.teal} />
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      ) : null}
      <Text style={styles.meta}>{booking.paymentMessage}</Text>
      {booking.status === 'upcoming' ? (
        <View style={styles.sessionRow}>
          <View style={{ flex: 1 }}>
            <TealButton
              label="Join Session"
              icon="videocam-outline"
              disabled={booking.payment !== 'paid'}
              onPress={() =>
                Alert.alert(
                  'Not ready',
                  'The session opens after a verified payment and within 5 minutes of the start time.',
                )
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <OutlineButton
              label="Reschedule"
              onPress={() =>
                router.push({ pathname: '/booking/[expertId]', params: { expertId: expert.id } })
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <OutlineButton label="Cancel" onPress={() => customerActions.cancelBooking(booking.id)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function MyBookingsScreen() {
  const state = useCustomerState();
  const [tab, setTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const items = state.bookings.filter((booking) => booking.status === tab);
  const next = items[0];
  const rest = items.slice(1);
  const expertsQuery = useQuery({
    queryKey: ['v1', 'experts', 'bookings-lookup'],
    queryFn: async () => {
      const result = await fetchExperts({ limit: 50 });
      if (!result.ok) throw new Error(result.message);
      return new Map(result.experts.map((expert) => [String(expert.id), mapExpertCard(expert)]));
    },
    enabled: !FRONTEND_ONLY && isApiConfigured(),
  });
  const expertMap = expertsQuery.data;
  return (
    <CustomerPage
      nav="discover"
      active="experts"
      onBack={() => router.back()}
      right={<IconButton icon="notifications-outline" label="Reminders" badge onPress={() => Alert.alert('Reminders', 'Session reminders will be sent when the notification API is connected.')} />}
    >
      <Heading>My Bookings</Heading>
      <Subtitle>Manage your upcoming and past sessions with experts.</Subtitle>
      <ChipRow
        options={[
          { id: 'upcoming', label: `Upcoming (${state.bookings.filter((item) => item.status === 'upcoming').length})`, icon: 'calendar-outline' },
          { id: 'past', label: `Past (${state.bookings.filter((item) => item.status === 'past').length})`, icon: 'time-outline' },
          { id: 'cancelled', label: `Cancelled (${state.bookings.filter((item) => item.status === 'cancelled').length})`, icon: 'close-circle-outline' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {next ? (
        <>
          <SectionTitle title={tab === 'upcoming' ? 'Next Session' : 'Sessions'} />
          <BookingCard
            booking={next}
            highlight={tab === 'upcoming'}
            expert={expertMap?.get(next.expertId)}
          />
        </>
      ) : (
        <Text style={styles.meta}>No {tab} sessions on this device.</Text>
      )}
      {rest.length > 0 ? (
        <SectionTitle title={tab === 'upcoming' ? 'Other Upcoming Sessions' : 'More'} />
      ) : null}
      {rest.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          expert={expertMap?.get(booking.expertId)}
        />
      ))}
      <Pressable style={styles.bookBanner} onPress={() => router.push('/(tabs)/experts')}>
        <Ionicons name="calendar-outline" size={22} color={customer.teal} />
        <View style={{ flex: 1 }}>
          <Text style={styles.promoTitle}>Book a New Session</Text>
          <Text style={styles.meta}>Get personalised guidance from our verified experts.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={customer.teal} />
      </Pressable>
    </CustomerPage>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: 'row' },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  trust: {
    backgroundColor: customer.mint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontFamily: customerFonts.medium,
    color: customer.tealDark,
    fontSize: 12,
  },
  trustText: { fontFamily: customerFonts.medium, color: customer.navy, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  speciality: { width: '48%', backgroundColor: customer.mint, borderRadius: 16, padding: 14 },
  specialityText: { fontFamily: customerFonts.bold, color: customer.navy, fontSize: 13 },
  expertCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: customer.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 12,
    alignItems: 'center',
  },
  expertCardColumn: {
    backgroundColor: customer.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: customer.line,
    padding: 12,
    gap: 8,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: customerFonts.bold, color: customer.tealDark },
  name: { fontFamily: customerFonts.bold, color: customer.navy, fontSize: 15 },
  meta: { fontFamily: customerFonts.regular, color: customer.body, fontSize: 12, lineHeight: 18 },
  expertSide: { alignItems: 'flex-end', gap: 8 },
  specialty: { backgroundColor: '#F1ECFF', color: '#6E5BD6', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, fontFamily: customerFonts.medium },
  bookNow: { backgroundColor: customer.teal, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  bookNowText: { color: customer.white, fontFamily: customerFonts.bold, fontSize: 12 },
  promo: { backgroundColor: '#F3F0FF', borderRadius: 18, padding: 16, gap: 8 },
  promoTitle: { fontFamily: customerFonts.bold, fontSize: 18, color: customer.navy },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { color: customer.teal, fontFamily: customerFonts.bold, fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: 'rgba(16,32,48,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: customer.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, gap: 10, maxHeight: '88%' },
  sheetTitle: { fontFamily: customerFonts.bold, fontSize: 18, color: customer.navy },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderRadius: 999, borderWidth: 1, borderColor: customer.line, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: customer.white },
  choiceOn: { backgroundColor: customer.teal, borderColor: customer.teal },
  choiceText: { fontFamily: customerFonts.medium, color: customer.navy, fontSize: 12 },
  choiceTextOn: { color: customer.white },
  profileTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  body: { fontFamily: customerFonts.regular, color: customer.body, fontSize: 14, lineHeight: 21 },
  area: { width: '31%', borderRadius: 16, padding: 10, minHeight: 88, alignItems: 'center', justifyContent: 'center', gap: 6 },
  areaText: { fontFamily: customerFonts.medium, fontSize: 11, color: customer.navy, textAlign: 'center' },
  sessionRow: { flexDirection: 'row', gap: 8 },
  session: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: customer.line, padding: 10, gap: 4, backgroundColor: customer.white },
  sessionOn: { borderColor: customer.teal, backgroundColor: customer.mint },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: customer.mint, borderRadius: 14, padding: 12 },
  footerRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  chatFab: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, borderColor: customer.teal, alignItems: 'center', justifyContent: 'center' },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 44, borderRadius: 14, paddingVertical: 8, alignItems: 'center', backgroundColor: customer.white, borderWidth: 1, borderColor: customer.line },
  dayOn: { backgroundColor: customer.teal, borderColor: customer.teal },
  onText: { color: customer.white },
  note: { minHeight: 90, borderRadius: 16, borderWidth: 1, borderColor: customer.line, backgroundColor: customer.white, padding: 12, textAlignVertical: 'top', fontFamily: customerFonts.regular, color: customer.navy },
  error: { color: customer.danger, fontFamily: customerFonts.medium },
  method: { flexDirection: 'row', gap: 10, alignItems: 'center', borderWidth: 1, borderColor: customer.line, borderRadius: 16, padding: 12, backgroundColor: customer.white },
  confirmIcon: { alignSelf: 'center', width: 84, height: 84, borderRadius: 42, backgroundColor: customer.teal, alignItems: 'center', justifyContent: 'center' },
  confirmTitle: { textAlign: 'center', fontFamily: customerFonts.bold, fontSize: 26, color: customer.navy },
  sample: { color: customer.peachInk, fontFamily: customerFonts.medium, fontSize: 11 },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: customer.mint,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  countdownText: { flex: 1, fontFamily: customerFonts.medium, fontSize: 12, color: customer.tealDark },
  bookBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: customer.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: customer.teal,
    padding: 14,
  },
});
