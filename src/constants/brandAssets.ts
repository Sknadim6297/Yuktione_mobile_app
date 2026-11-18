import type { ImageSourcePropType } from 'react-native';

/**
 * Original YuktiOne website assets (copied from public_html/public/frontend/assets,
 * resized for mobile — composition and colours unchanged).
 */
export const BRAND_ASSETS = {
  /** frontend/assets/Yuktione_logo.png — transparent, 3:1. */
  logo: require('../../assets/website/yuktione-logo.png') as ImageSourcePropType,
  /** frontend/assets/img/register-hero.png — customer & professional sign-up hero. */
  registerHero: require('../../assets/website/register-hero.jpg') as ImageSourcePropType,
  /** frontend/assets/img/yuktione-hero-poster.jpg — home hero poster. */
  heroPoster: require('../../assets/website/hero-poster.jpg') as ImageSourcePropType,
  /** frontend/assets/img/experts-hero.webp — tools & experts hero cut-out. */
  expertsHero: require('../../assets/website/experts-hero.webp') as ImageSourcePropType,
  /** frontend/assets/img/professional-laptop.webp — join-as-professional cut-out. */
  professionalLaptop: require('../../assets/website/professional-laptop.webp') as ImageSourcePropType,
} as const;

/** Explore-by-need photography (frontend/assets/img/home-cats). */
export const CATEGORY_IMAGES = {
  career: require('../../assets/website/categories/cat-career.jpg') as ImageSourcePropType,
  create: require('../../assets/website/categories/cat-create.jpg') as ImageSourcePropType,
  fruit: require('../../assets/website/categories/cat-fruit.jpg') as ImageSourcePropType,
  growth: require('../../assets/website/categories/cat-growth.jpg') as ImageSourcePropType,
  health: require('../../assets/website/categories/cat-health.jpg') as ImageSourcePropType,
  heart: require('../../assets/website/categories/cat-heart.jpg') as ImageSourcePropType,
  lifestyle: require('../../assets/website/categories/cat-lifestyle.jpg') as ImageSourcePropType,
  lotus: require('../../assets/website/categories/cat-lotus.jpg') as ImageSourcePropType,
  meditate: require('../../assets/website/categories/cat-meditate.jpg') as ImageSourcePropType,
  moon: require('../../assets/website/categories/cat-moon.jpg') as ImageSourcePropType,
  parent: require('../../assets/website/categories/cat-parent.jpg') as ImageSourcePropType,
  stones: require('../../assets/website/categories/cat-stones.jpg') as ImageSourcePropType,
} as const;

/** Programme cover photography (frontend/assets/img/programmes). */
export const PROGRAMME_IMAGES = {
  calm: require('../../assets/website/programmes/programme-calm.jpg') as ImageSourcePropType,
  career: require('../../assets/website/programmes/programme-career.jpg') as ImageSourcePropType,
  habits: require('../../assets/website/programmes/programme-habits.jpg') as ImageSourcePropType,
} as const;

export type CategoryImageKey = keyof typeof CATEGORY_IMAGES;
