import { brand, brandGradients } from './brand';
import { colors } from './colors';
import { customer, customerFonts } from './customer';
import { motion } from './motion';
import { radius, spacing } from './spacing';
import { shadows } from './shadows';
import { fontFamilies, typography } from './typography';

export const theme = {
  brand,
  brandGradients,
  colors,
  customer,
  customerFonts,
  typography,
  fontFamilies,
  spacing,
  radius,
  shadows,
  motion,
} as const;

export type Theme = typeof theme;

export {
  brand,
  brandGradients,
  colors,
  customer,
  customerFonts,
  typography,
  fontFamilies,
  spacing,
  radius,
  shadows,
  motion,
};
