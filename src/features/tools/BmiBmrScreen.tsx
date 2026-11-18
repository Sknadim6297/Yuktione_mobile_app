import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';

import { FormInput, PrimaryButton, SecondaryButton } from '@/components/brand';
import { CustomerPage } from '@/features/customer/ui';
import {
  ACTIVITIES,
  BmiInputError,
  calculateBmiBmr,
  FORMULA_VERSION,
  RESULT_BLURBS,
  SEX_OPTIONS,
  type BmiResult,
  type RawBmiInput,
} from '@/features/tools/bmiBmr';
import {
  AccessNote,
  backToTools,
  openToolOnWebsite,
  ToolHeroCard,
} from '@/features/tools/ToolDetailParts';
import type { ApiTool } from '@/services/api/catalog';
import { brand, customerFonts } from '@/theme';

const EMPTY: RawBmiInput = {
  age: '',
  sex: '',
  activity: '',
  heightUnit: 'cm',
  weightUnit: 'kg',
  heightCm: '',
  heightFt: '',
  heightIn: '',
  weightKg: '',
  weightLb: '',
  excluded: false,
};

/** BMI, BMR & TDEE Calculator — same inputs, validation and maths as website tools/bmi-bmr. */
export function BmiBmrScreen({ tool }: { tool: ApiTool }) {
  const [input, setInput] = useState<RawBmiInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BmiResult | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const update = <K extends keyof RawBmiInput>(key: K, value: RawBmiInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const calculate = () => {
    try {
      setResult(calculateBmiBmr(input));
      setError(null);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof BmiInputError ? caught.message : 'Please check your details and try again.');
    }
  };

  return (
    <CustomerPage onBack={backToTools} scrollRef={scrollRef} dismissKeyboardOnDrag>
      <ToolHeroCard tool={tool} />
      <AccessNote slug={tool.slug} />

      <View style={styles.form}>
        <Text style={styles.formTitle}>BMI, BMR &amp; TDEE Calculator</Text>
        <Text style={styles.formLead}>Educational screening estimates from your measurements—not medical advice.</Text>

        <Field label="Gender" hint="Used only for Mifflin–St Jeor BMR.">
          <Segmented
            options={SEX_OPTIONS.map((option) => ({ id: option.key, label: option.label }))}
            value={input.sex}
            onChange={(value) => update('sex', value)}
          />
        </Field>

        <FormInput
          label="Age (yrs)"
          hint="Adult categories from age 18+."
          keyboardType="number-pad"
          value={input.age}
          onChangeText={(value) => update('age', value)}
          maxLength={3}
        />

        <Field label="Weight">
          <Segmented
            options={[
              { id: 'kg', label: 'kg' },
              { id: 'lb', label: 'lb' },
            ]}
            value={input.weightUnit}
            onChange={(value) => update('weightUnit', value)}
          />
          {input.weightUnit === 'kg' ? (
            <FormInput
              keyboardType="decimal-pad"
              value={input.weightKg}
              onChangeText={(value) => update('weightKg', value)}
              placeholder="e.g. 70"
              accessibilityLabel="Weight in kilograms"
            />
          ) : (
            <FormInput
              keyboardType="decimal-pad"
              value={input.weightLb}
              onChangeText={(value) => update('weightLb', value)}
              placeholder="e.g. 154"
              accessibilityLabel="Weight in pounds"
            />
          )}
        </Field>

        <Field label="Height">
          <Segmented
            options={[
              { id: 'cm', label: 'cm' },
              { id: 'ft_in', label: 'ft/in' },
            ]}
            value={input.heightUnit}
            onChange={(value) => update('heightUnit', value)}
          />
          {input.heightUnit === 'cm' ? (
            <FormInput
              keyboardType="decimal-pad"
              value={input.heightCm}
              onChangeText={(value) => update('heightCm', value)}
              placeholder="e.g. 170"
              accessibilityLabel="Height in centimetres"
            />
          ) : (
            <View style={styles.row}>
              <View style={styles.flex}>
                <FormInput
                  keyboardType="decimal-pad"
                  value={input.heightFt}
                  onChangeText={(value) => update('heightFt', value)}
                  placeholder="ft"
                  accessibilityLabel="Height, feet"
                />
              </View>
              <View style={styles.flex}>
                <FormInput
                  keyboardType="decimal-pad"
                  value={input.heightIn}
                  onChangeText={(value) => update('heightIn', value)}
                  placeholder="in"
                  accessibilityLabel="Height, inches"
                />
              </View>
            </View>
          )}
        </Field>

        <Field label="Physical activity">
          <View style={styles.activities} accessibilityRole="radiogroup">
            {ACTIVITIES.map((activity) => {
              const on = input.activity === activity.key;
              return (
                <Pressable
                  key={activity.key}
                  accessibilityRole="radio"
                  aria-checked={on}
                  accessibilityLabel={`${activity.label}, ${activity.description}`}
                  onPress={() => update('activity', activity.key)}
                  style={[styles.activity, on && styles.activityOn]}
                >
                  <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                  <View style={styles.flex}>
                    <Text style={styles.activityLabel}>{activity.label}</Text>
                    <Text style={styles.activityDesc}>{activity.description}</Text>
                  </View>
                  <Ionicons
                    name={on ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={on ? brand.plum : brand.silver}
                  />
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Pressable
          accessibilityRole="checkbox"
          aria-checked={input.excluded}
          onPress={() => update('excluded', !input.excluded)}
          style={styles.check}
        >
          <Ionicons
            name={input.excluded ? 'checkbox' : 'square-outline'}
            size={22}
            color={input.excluded ? brand.plum : brand.grey}
          />
          <Text style={styles.checkText}>Pregnant, breastfeeding, or outside adult equation use</Text>
        </Pressable>

        {error ? (
          <View style={styles.error} accessibilityLiveRegion="assertive">
            <Ionicons name="alert-circle" size={18} color={brand.magenta} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton label="Calculate" onPress={calculate} />
      </View>

      {result ? <Results result={result} tool={tool} onReset={() => setResult(null)} /> : null}
    </CustomerPage>
  );
}

function Results({ result, tool, onReset }: { result: BmiResult; tool: ApiTool; onReset: () => void }) {
  return (
    <View style={styles.results} accessibilityLiveRegion="polite">
      <Text style={styles.formTitle}>Your results</Text>
      <Text style={styles.formLead}>Estimates only · {FORMULA_VERSION}</Text>

      <Metric
        label="BMI"
        value={result.bmi.display.toFixed(1)}
        unit="kg/m²"
        caption={
          result.bmi.category
            ? result.bmi.category.label
            : result.flags.minor
              ? 'Under 18 — adult category not applied'
              : undefined
        }
        blurb={RESULT_BLURBS.bmi}
      />
      <Metric
        label="BMR"
        value={result.bmr.display === null ? '—' : formatKcal(result.bmr.display)}
        unit={result.bmr.display === null ? undefined : 'kcal/day'}
        caption={result.bmr.eligible ? 'Mifflin–St Jeor' : energyCaption(result)}
        blurb={RESULT_BLURBS.bmr}
      />
      <Metric
        label="TDEE"
        value={result.tdee.display === null ? '—' : formatKcal(result.tdee.display)}
        unit={result.tdee.display === null ? undefined : 'kcal/day'}
        caption={
          result.tdee.eligible ? `${result.inputs.activityLabel} ×${result.inputs.activityFactor}` : undefined
        }
        blurb={RESULT_BLURBS.tdee}
      />

      {result.guidance.excludedNotice ? <Notice text={result.guidance.excludedNotice} /> : null}
      {result.guidance.minorNotice ? <Notice text={result.guidance.minorNotice} /> : null}

      <View style={styles.examples}>
        <Text style={styles.examplesTitle}>Energy guidance</Text>
        {result.guidance.examples ? (
          <>
            <Text style={styles.small}>
              Estimated maintenance energy expenditure (TDEE):{' '}
              <Text style={styles.strong}>{formatKcal(result.guidance.examples.maintain)} kcal/day</Text>.
            </Text>
            <ExampleRow label="Maintain (estimate)" value={result.guidance.examples.maintain} />
            <ExampleRow label="Gentle deficit example" value={result.guidance.examples.gentleDeficit} />
            <ExampleRow label="Gentle surplus example" value={result.guidance.examples.gentleSurplus} />
            <Text style={styles.small}>{result.guidance.examples.disclaimer}</Text>
          </>
        ) : result.flags.sexUnspecified ? (
          <Text style={styles.small}>
            Without a sex-based equation input, adult calorie illustrations are not shown.
          </Text>
        ) : (
          <Text style={styles.small}>Adult calorie illustrations are not shown for this calculation.</Text>
        )}
      </View>

      <View style={styles.notes}>
        <Text style={styles.examplesTitle}>General tips</Text>
        {GENERAL_TIPS.concat(result.guidance.notes).map((note) => (
          <Text key={note} style={styles.small}>
            • {note}
          </Text>
        ))}
      </View>

      <View style={styles.saveNote}>
        <Ionicons name="bookmark-outline" size={18} color={brand.plum} />
        <Text style={styles.saveText}>
          Saving to history is not available in the app yet. On the YuktiOne website, signed-in members can save
          results and view their history.
        </Text>
      </View>
      <View style={styles.actions}>
        <SecondaryButton label="Recalculate" icon="refresh" onPress={onReset} compact />
        <SecondaryButton label="History on website" icon="open-outline" onPress={() => void openToolOnWebsite(tool)} compact />
      </View>
    </View>
  );
}

const GENERAL_TIPS = [
  'Regular movement and balanced eating patterns support wellbeing for many people.',
  'Hydration, sleep and stress also influence how energy needs feel day to day.',
  'If you have health conditions or special dietary needs, seek professional guidance.',
];

/** PHP number_format(): comma thousands separators, no decimals. */
function formatKcal(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function energyCaption(result: BmiResult): string | undefined {
  if (result.flags.sexUnspecified) return 'Sex-based equation not used';
  if (result.flags.excluded) return 'Outside adult equation use';
  if (result.flags.minor) return 'Adult estimate not shown';
  return undefined;
}

function Metric({
  label,
  value,
  unit,
  caption,
  blurb,
}: {
  label: string;
  value: string;
  unit?: string;
  caption?: string;
  blurb: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value}
        {unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}
      </Text>
      {caption ? <Text style={styles.metricCaption}>{caption}</Text> : null}
      <Text style={styles.small}>{blurb}</Text>
    </View>
  );
}

function ExampleRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.exampleRow}>
      <Text style={styles.exampleLabel}>{label}</Text>
      <Text style={styles.exampleValue}>{formatKcal(value)} kcal/day</Text>
    </View>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <View style={styles.saveNote}>
      <Ionicons name="information-circle-outline" size={18} color={brand.plum} />
      <Text style={styles.saveText}>{text}</Text>
    </View>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {hint ? <Text style={styles.small}>{hint}</Text> : null}
    </View>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T | '';
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((option) => {
        const on = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            aria-checked={on}
            onPress={() => onChange(option.id)}
            style={[styles.segment, on && styles.segmentOn]}
          >
            <Text style={[styles.segmentText, on && styles.segmentTextOn]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 10 },
  form: {
    gap: 16,
    padding: 18,
    borderRadius: 22,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  formTitle: { fontFamily: customerFonts.bold, fontSize: 19, color: brand.ink, letterSpacing: -0.3 },
  formLead: { fontFamily: customerFonts.regular, fontSize: 13.5, lineHeight: 19, color: brand.grey, marginTop: -10 },
  field: { gap: 8 },
  fieldLabel: { fontFamily: customerFonts.semibold, fontSize: 13.5, color: brand.ink },
  small: { fontFamily: customerFonts.regular, fontSize: 12.5, lineHeight: 18, color: brand.grey },
  segmented: {
    flexDirection: 'row',
    backgroundColor: brand.pearlDeep,
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  segment: { flex: 1, minHeight: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentOn: { backgroundColor: brand.plum },
  segmentText: { fontFamily: customerFonts.semibold, fontSize: 13, color: brand.ink },
  segmentTextOn: { color: brand.white },
  activities: { gap: 8 },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.silver,
    backgroundColor: brand.white,
  },
  activityOn: { borderColor: brand.plum, backgroundColor: brand.plumSoft },
  activityEmoji: { fontSize: 22 },
  activityLabel: { fontFamily: customerFonts.bold, fontSize: 14, color: brand.ink },
  activityDesc: { fontFamily: customerFonts.regular, fontSize: 12.5, color: brand.grey },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  checkText: { flex: 1, fontFamily: customerFonts.medium, fontSize: 13.5, color: brand.ink },
  error: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: brand.magentaSoft,
  },
  errorText: { flex: 1, fontFamily: customerFonts.semibold, fontSize: 13, color: brand.plumDark },
  results: {
    gap: 12,
    padding: 18,
    borderRadius: 22,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.divider,
  },
  metric: { gap: 4, padding: 14, borderRadius: 16, backgroundColor: brand.pearl, borderWidth: 1, borderColor: brand.divider },
  metricLabel: { fontFamily: customerFonts.bold, fontSize: 12, letterSpacing: 0.6, color: brand.plum },
  metricValue: { fontFamily: customerFonts.bold, fontSize: 30, letterSpacing: -0.8, color: brand.ink },
  metricUnit: { fontFamily: customerFonts.medium, fontSize: 14, color: brand.grey, letterSpacing: 0 },
  metricCaption: { fontFamily: customerFonts.semibold, fontSize: 14, color: brand.ink },
  examples: { gap: 6 },
  strong: { fontFamily: customerFonts.bold, color: brand.ink },
  examplesTitle: { fontFamily: customerFonts.bold, fontSize: 15, color: brand.ink },
  exampleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: brand.divider },
  exampleLabel: { flex: 1, fontFamily: customerFonts.regular, fontSize: 13.5, color: brand.grey },
  exampleValue: { fontFamily: customerFonts.bold, fontSize: 13.5, color: brand.ink },
  notes: { gap: 4 },
  saveNote: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, backgroundColor: brand.plumSoft },
  saveText: { flex: 1, fontFamily: customerFonts.regular, fontSize: 13, lineHeight: 19, color: brand.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
