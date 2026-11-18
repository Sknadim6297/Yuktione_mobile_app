import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { openWebsitePath } from '@/services/website/openWebsite';
import { BRAND_ASSETS } from '@/constants/brandAssets';
import { CustomerPage, Heading, Subtitle, TealButton } from '@/features/customer/ui';
import { brand, customer, customerFonts } from '@/theme';

const ROLES = [
  ['Wellness Coach', 'flower-outline'],
  ['Tarot Reader', 'sparkles-outline'],
  ['Life Coach', 'leaf-outline'],
  ['Mindfulness Expert', 'body-outline'],
  ['Therapist / Counsellor', 'medkit-outline'],
  ['Other Experts', 'ellipsis-horizontal'],
] as const;

const STEPS = [
  ['1. Apply', 'Fill in your profile and expertise details', 'document-text-outline'],
  ['2. Verify', 'We review and verify your credentials', 'shield-checkmark-outline'],
  ['3. Get Approved', 'Create your profile and set your availability', 'calendar-outline'],
  ['4. Start Guiding', 'Go live and connect with users', 'rocket-outline'],
] as const;

export function JoinProfessionalScreen() {
  const [guidelines, setGuidelines] = useState(false);
  return (
    <CustomerPage onBack={() => router.back()} footer={
      <View style={{ gap: 8 }}>
        <TealButton label="Apply Now" icon="person-add-outline" onPress={() => router.push('/professional/register')} />
        <Text style={styles.footerNote}>
          Have questions?{' '}
          <Text style={styles.link} onPress={() => void openWebsitePath('home', { title: 'Contact support', message: 'Opens the YuktiOne website. A dedicated support inbox is not configured in the app.' })}>
            Contact Support
          </Text>
        </Text>
        <Pressable onPress={() => router.push('/professional/login')}>
          <Text style={styles.footerNote}>Already registered? Sign in</Text>
        </Pressable>
      </View>
    }>
      <Image source={BRAND_ASSETS.professionalLaptop} style={styles.hero} resizeMode="contain" accessibilityLabel="A professional working on a laptop" />
      <Heading>Join as a Professional</Heading>
      <Subtitle>Share your expertise, guide people and make a positive impact with YuktiOne.</Subtitle>
      <View style={styles.benefits}>
        {[
          ['Build Your Client Base', 'people-outline'],
          ['Flexible Schedule', 'calendar-outline'],
          ['Earn Confidently', 'cash-outline'],
          ['Create Real Impact', 'heart-outline'],
        ].map(([label, icon]) => (
          <View key={label} style={styles.benefit}>
            <Ionicons name={icon as 'people-outline'} size={16} color={customer.teal} />
            <Text style={styles.benefitText}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.section}>Who Can Apply?</Text>
        <Pressable onPress={() => setGuidelines((value) => !value)}><Text style={styles.link}>View Guidelines →</Text></Pressable>
      </View>
      <View style={styles.grid}>
        {ROLES.map(([label, icon]) => (
          <View key={label} style={styles.role}>
            <Ionicons name={icon} size={20} color={customer.teal} />
            <Text style={styles.roleText}>{label}</Text>
          </View>
        ))}
      </View>
      {guidelines ? (
        <Text style={styles.body}>
          Share accurate credentials, a short bio, and the services you can offer. Applications are reviewed by the existing professional registration flow. Approval is not instant.
        </Text>
      ) : null}
      <Text style={styles.section}>Why Join YuktiOne?</Text>
      {[
        'Reach a growing, like-minded community',
        'Manage sessions, bookings and clients easily',
        'Get secure payments and transparent earnings',
        'Be part of a trusted wellness platform',
      ].map((item) => (
        <Text key={item} style={styles.body}>✓ {item}</Text>
      ))}
      <Text style={styles.section}>How It Works?</Text>
      <View style={styles.steps}>
        {STEPS.map(([title, detail, icon]) => (
          <View key={title} style={styles.step}>
            <Ionicons name={icon} size={20} color={customer.teal} />
            <Text style={styles.roleText}>{title}</Text>
            <Text style={styles.detail}>{detail}</Text>
          </View>
        ))}
      </View>
      <Pressable onPress={() => Alert.alert('Application', 'Apply Now opens the existing professional registration form.')}>
        <Text style={styles.body}>The Apply button uses the registration screens already in the app.</Text>
      </Pressable>
    </CustomerPage>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 190, borderRadius: 18, backgroundColor: brand.heroCream },
  benefits: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  benefit: { width: '48%', flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: customer.white, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: customer.line },
  benefitText: { flex: 1, fontFamily: customerFonts.medium, fontSize: 12, color: customer.navy },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { fontFamily: customerFonts.bold, fontSize: 18, color: customer.navy },
  link: { color: customer.teal, fontFamily: customerFonts.bold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  role: { width: '31%', flexGrow: 1, backgroundColor: customer.mint, borderRadius: 16, padding: 10, gap: 6, minHeight: 84 },
  roleText: { fontFamily: customerFonts.bold, fontSize: 12, color: customer.navy },
  body: { fontFamily: customerFonts.regular, fontSize: 14, color: customer.body, lineHeight: 20 },
  steps: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  step: { width: '48%', backgroundColor: customer.white, borderRadius: 16, padding: 10, gap: 4, borderWidth: 1, borderColor: customer.line },
  detail: { fontFamily: customerFonts.regular, fontSize: 11, color: customer.body },
  footerNote: { textAlign: 'center', fontFamily: customerFonts.regular, color: customer.body, fontSize: 13 },
});
