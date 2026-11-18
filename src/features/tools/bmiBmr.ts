/**
 * Port of the website BMI/BMR/TDEE calculator (app/Services/BmiBmrCalculator.php,
 * BmiBmrInputNormalizer.php, app/Support/BmiBmr/BmiBmrCatalog.php). Keep the
 * ranges, bands, factors and messages identical to the PHP source.
 */

export const FORMULA_VERSION = 'bmi-who-adult-v1+mifflin-st-jeor-v1';

const ADULT_MIN_AGE = 18;
const AGE_MIN = 1;
const AGE_MAX = 120;
const HEIGHT_CM_MIN = 50;
const HEIGHT_CM_MAX = 250;
const WEIGHT_KG_MIN = 10;
const WEIGHT_KG_MAX = 400;

export type Sex = 'female' | 'male' | 'unspecified';

export const SEX_OPTIONS: { key: Sex; label: string }[] = [
  { key: 'female', label: 'Female' },
  { key: 'male', label: 'Male' },
  { key: 'unspecified', label: 'Prefer not to say' },
];

export type ActivityKey =
  | 'sedentary'
  | 'lightly-active'
  | 'moderately-active'
  | 'very-active'
  | 'extra-active';

export const ACTIVITIES: { key: ActivityKey; label: string; description: string; factor: number; emoji: string }[] = [
  { key: 'sedentary', label: 'Sedentary', description: 'Little or no exercise', factor: 1.2, emoji: '🪑' },
  { key: 'lightly-active', label: 'Lightly active', description: 'Light exercise 1–3 days/week', factor: 1.375, emoji: '🚶' },
  { key: 'moderately-active', label: 'Moderately active', description: 'Moderate exercise 3–5 days/week', factor: 1.55, emoji: '🚴' },
  { key: 'very-active', label: 'Very active', description: 'Hard exercise 6–7 days/week', factor: 1.725, emoji: '🏃' },
  { key: 'extra-active', label: 'Extra active', description: 'Very hard exercise & physical job', factor: 1.9, emoji: '🏋️' },
];

export const RESULT_BLURBS = {
  bmi: 'Body Mass Index compares weight to height. It is a population screening ratio—not a diagnosis of health or body fat.',
  bmr: 'Basal Metabolic Rate estimates calories your body may use at rest. Mifflin–St Jeor is an equation estimate, not a lab measurement.',
  tdee: 'Total Daily Energy Expenditure multiplies BMR by an activity factor to approximate daily calorie needs. Factors are rough guides only.',
};

const BMI_CATEGORIES: { key: string; label: string; min: number | null; maxExclusive: number | null }[] = [
  { key: 'underweight', label: 'Underweight', min: null, maxExclusive: 18.5 },
  { key: 'healthy', label: 'Healthy weight', min: 18.5, maxExclusive: 25 },
  { key: 'overweight', label: 'Overweight', min: 25, maxExclusive: 30 },
  { key: 'obesity', label: 'Obesity', min: 30, maxExclusive: null },
];

export type RawBmiInput = {
  age: string;
  sex: Sex | '';
  activity: ActivityKey | '';
  heightUnit: 'cm' | 'ft_in';
  weightUnit: 'kg' | 'lb';
  heightCm: string;
  heightFt: string;
  heightIn: string;
  weightKg: string;
  weightLb: string;
  excluded: boolean;
};

export type BmiResult = {
  inputs: { age: number; heightCm: number; weightKg: number; sex: Sex; activityLabel: string; activityFactor: number; excluded: boolean };
  bmi: { display: number; isAdult: boolean; category: { key: string; label: string } | null };
  bmr: { eligible: boolean; display: number | null };
  tdee: { eligible: boolean; display: number | null };
  flags: { minor: boolean; excluded: boolean; sexUnspecified: boolean };
  guidance: {
    notes: string[];
    minorNotice: string | null;
    excludedNotice: string | null;
    examples: { disclaimer: string; maintain: number; gentleDeficit: number; gentleSurplus: number } | null;
  };
};

export class BmiInputError extends Error {}

function ucfirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** BmiBmrInputNormalizer::requireNumber. */
function requireNumber(value: string | undefined, label: string): number {
  const raw = (value ?? '').trim();
  if (raw === '') throw new BmiInputError(`${ucfirst(label)} is required.`);
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(raw)) {
    throw new BmiInputError(`${ucfirst(label)} must be numeric.`);
  }
  const number = Number(raw);
  if (!Number.isFinite(number)) throw new BmiInputError(`${ucfirst(label)} must be a finite number.`);
  if (number <= 0 && label !== 'height (inches)') {
    throw new BmiInputError(`${ucfirst(label)} must be greater than zero.`);
  }
  return number;
}

export function calculateBmiBmr(raw: RawBmiInput): BmiResult {
  const ageNumber = requireNumber(raw.age, 'age');
  if (!Number.isInteger(ageNumber)) throw new BmiInputError('Age must be a whole number of years.');
  const age = ageNumber;

  let heightCm: number;
  if (raw.heightUnit === 'cm') {
    heightCm = requireNumber(raw.heightCm, 'height');
  } else {
    const feet = requireNumber(raw.heightFt, 'height (feet)');
    const inches = raw.heightIn.trim() === '' ? 0 : requireNumber(raw.heightIn, 'height (inches)');
    if (inches < 0 || inches >= 12) throw new BmiInputError('Inches must be between 0 and 11.99.');
    if (feet <= 0) throw new BmiInputError('Feet must be greater than zero.');
    heightCm = (feet * 12 + inches) * 2.54;
  }

  const weightKg =
    raw.weightUnit === 'kg'
      ? requireNumber(raw.weightKg, 'weight')
      : requireNumber(raw.weightLb, 'weight') * 0.45359237;

  if (!raw.sex) throw new BmiInputError('Please choose a calculation sex option.');
  const activity = ACTIVITIES.find((item) => item.key === raw.activity);
  if (!activity) throw new BmiInputError('Please choose an activity level.');

  if (age < AGE_MIN || age > AGE_MAX) throw new BmiInputError('Age is outside the supported range.');
  if (heightCm < HEIGHT_CM_MIN || heightCm > HEIGHT_CM_MAX) {
    throw new BmiInputError('Height is outside the supported range.');
  }
  if (weightKg < WEIGHT_KG_MIN || weightKg > WEIGHT_KG_MAX) {
    throw new BmiInputError('Weight is outside the supported range.');
  }

  const sex = raw.sex;
  const excluded = raw.excluded;
  const heightM = heightCm / 100;
  const bmiExact = weightKg / (heightM * heightM);
  const isAdult = age >= ADULT_MIN_AGE;
  const category = isAdult ? classifyBmi(bmiExact) : null;

  const energyEligible = isAdult && !excluded && (sex === 'male' || sex === 'female');
  let bmrExact: number | null = null;
  let tdeeExact: number | null = null;
  if (energyEligible) {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    bmrExact = sex === 'male' ? base + 5 : base - 161;
    tdeeExact = bmrExact * activity.factor;
  }

  const maintain = tdeeExact === null ? null : phpRound(tdeeExact);

  return {
    inputs: {
      age,
      heightCm: phpRound(heightCm, 2),
      weightKg: phpRound(weightKg, 2),
      sex,
      activityLabel: activity.label,
      activityFactor: activity.factor,
      excluded,
    },
    bmi: { display: phpRound(bmiExact, 1), isAdult, category },
    bmr: { eligible: energyEligible, display: bmrExact === null ? null : phpRound(bmrExact) },
    tdee: { eligible: energyEligible, display: maintain },
    flags: { minor: !isAdult, excluded, sexUnspecified: sex === 'unspecified' },
    guidance: {
      notes: [
        'BMI is a population screening measure based on height and weight. It does not measure body fat, metabolic health, or fitness.',
        'BMR and TDEE from Mifflin–St Jeor are estimates from a binary-sex equation model—not laboratory measurements.',
        'Activity multipliers are rough and may overestimate or underestimate real energy needs.',
        'This tool does not diagnose conditions or replace advice from a qualified healthcare professional.',
      ],
      minorNotice: isAdult
        ? null
        : 'Standard adult BMI categories and adult calorie estimates are not applied for ages under 18. Speak with a paediatric or healthcare professional for age-appropriate guidance.',
      excludedNotice: excluded
        ? 'Pregnancy, breastfeeding, or similar circumstances fall outside the intended use of these adult estimates. Routine adult calorie targets are not presented as personalised recommendations.'
        : null,
      examples:
        energyEligible && maintain !== null
          ? {
              disclaimer:
                'Illustrative examples only—not prescriptions. Do not use restrictive targets without professional guidance.',
              maintain,
              gentleDeficit: Math.max(1200, maintain - 300),
              gentleSurplus: maintain + 200,
            }
          : null,
    },
  };
}

function classifyBmi(bmiExact: number): { key: string; label: string } {
  for (const band of BMI_CATEGORIES) {
    const minOk = band.min === null || bmiExact >= band.min;
    const maxOk = band.maxExclusive === null || bmiExact < band.maxExclusive;
    if (minOk && maxOk) return { key: band.key, label: band.label };
  }
  throw new BmiInputError('BMI could not be classified.');
}

/** PHP round(): half away from zero. */
function phpRound(value: number, precision = 0): number {
  const factor = 10 ** precision;
  const scaled = Math.abs(value) * factor;
  const rounded = Math.round(scaled + Number.EPSILON * scaled);
  return (Math.sign(value) * rounded) / factor;
}
