import { z } from 'zod';

import { CITY_OPTIONS, EXPERIENCE_OPTIONS } from '@/features/professional/constants';

const experienceValueList = EXPERIENCE_OPTIONS.map((option) => option.value);
const cityValueList = [...CITY_OPTIONS];

/** Mirrors ProfessionalController@register validation (without file uploads). */
export const basicDetailsSchema = z
  .object({
    first_name: z.string().trim().min(1, 'First name is required.').max(255),
    last_name: z.string().trim().min(1, 'Last name is required.').max(255),
    email: z.string().trim().email('Please enter a valid email address.'),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone is required.')
      .max(20, 'Phone cannot exceed 20 characters.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    password_confirmation: z.string().min(1, 'Please confirm your password.'),
    address: z
      .string()
      .min(1, 'Please select your city.')
      .refine((value) => cityValueList.includes(value as (typeof CITY_OPTIONS)[number]), {
        message: 'Please select your city.',
      }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Password confirmation does not match.',
    path: ['password_confirmation'],
  });

export const qualificationsSchema = z.object({
  education: z
    .string()
    .trim()
    .min(1, 'Education or qualification is required.')
    .max(255),
  education2: z.string().trim().max(255).optional().or(z.literal('')),
  comments: z.string().optional().or(z.literal('')),
});

export const experienceSchema = z.object({
  experience: z
    .string()
    .min(1, 'Please select your professional experience.')
    .refine((value) => experienceValueList.includes(value as (typeof EXPERIENCE_OPTIONS)[number]['value']), {
      message: 'Please select your professional experience.',
    }),
});

export const servicesPricingSchema = z.object({
  specialization: z
    .string()
    .trim()
    .min(1, 'Service you offer is required.')
    .max(255),
  starting_price: z
    .string()
    .trim()
    .min(1, 'Starting price is required.')
    .max(100, 'Starting price cannot exceed 100 characters.')
    .refine(
      (value) => /^\d+(\s*-\s*\d+)?$/.test(value),
      'Enter a fixed price or range (e.g. 1500 or 1000-2000).',
    ),
});

export const professionalSetupSchema = basicDetailsSchema
  .and(qualificationsSchema)
  .and(experienceSchema)
  .and(servicesPricingSchema);

export type BasicDetailsValues = z.infer<typeof basicDetailsSchema>;
export type QualificationsValues = z.infer<typeof qualificationsSchema>;
export type ExperienceValues = z.infer<typeof experienceSchema>;
export type ServicesPricingValues = z.infer<typeof servicesPricingSchema>;
export type ProfessionalSetupValues = z.infer<typeof professionalSetupSchema>;

export type ProfessionalSetupDraft = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  address: string;
  education: string;
  education2: string;
  comments: string;
  experience: string;
  specialization: string;
  starting_price: string;
};

export const emptySetupValues: ProfessionalSetupDraft = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  address: '',
  education: '',
  education2: '',
  comments: '',
  experience: '',
  specialization: '',
  starting_price: '',
};

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const registerEmailSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit verification code.'),
});

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}
