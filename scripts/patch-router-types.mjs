import { readFileSync, writeFileSync } from 'node:fs';

const p = '.expo/types/router.d.ts';
let text = readFileSync(p, 'utf8');

const staticRoutes = [
  '/auth/classic',
  '/classic/home',
  '/classic/tools',
  '/classic/experts',
];

const needle = '{ pathname: `/auth/verify-otp`; params?: Router.UnknownInputParams; }';
const add =
  needle +
  staticRoutes
    .map((r) => ` | { pathname: \`${r}\`; params?: Router.UnknownInputParams; }`)
    .join('') +
  ' | { pathname: `/classic/categories/[slug]`, params: Router.UnknownInputParams & { slug: string | number; } }';
if (!text.includes(needle)) throw new Error('input needle missing');
text = text.replace(needle, add);

const needle2 = '{ pathname: `/auth/verify-otp`; params?: Router.UnknownOutputParams; }';
const add2 =
  needle2 +
  staticRoutes
    .map((r) => ` | { pathname: \`${r}\`; params?: Router.UnknownOutputParams; }`)
    .join('') +
  ' | { pathname: `/classic/categories/[slug]`, params: Router.UnknownOutputParams & { slug: string; } }';
if (!text.includes(needle2)) throw new Error('output needle missing');
text = text.replace(needle2, add2);

const old =
  '`/auth/verify-otp${`?${string}` | `#${string}` | \'\'}` | `/customer${`?${string}` | `#${string}` | \'\'}`';
const neu =
  '`/auth/verify-otp${`?${string}` | `#${string}` | \'\'}` | `/auth/classic${`?${string}` | `#${string}` | \'\'}` | `/classic/home${`?${string}` | `#${string}` | \'\'}` | `/classic/tools${`?${string}` | `#${string}` | \'\'}` | `/classic/experts${`?${string}` | `#${string}` | \'\'}` | `/customer${`?${string}` | `#${string}` | \'\'}`';
if (!text.includes(old)) throw new Error('old href template missing');
text = text.replace(old, neu);

const marker = '| `/auth/verify-otp` | `/customer`';
if (!text.includes(marker)) throw new Error('marker missing');
text = text.replace(
  marker,
  '| `/auth/verify-otp` | `/auth/classic` | `/classic/home` | `/classic/tools` | `/classic/experts` | `/customer`',
);

const oldc = '`/categories/${Router.SingleRoutePart<T>}`';
const newc = `${oldc} | \`/classic/categories/\${Router.SingleRoutePart<T>}\``;
if (!text.includes(oldc)) throw new Error('categories dynamic missing');
text = text.replace(oldc, newc);

const obj =
  '{ pathname: `/categories/[slug]`, params: Router.UnknownInputParams & { slug: string | number; } }';
const objAdd =
  `${obj} | { pathname: \`/classic/categories/[slug]\`, params: Router.UnknownInputParams & { slug: string | number; } }`;
if (!text.includes(obj)) throw new Error('categories object missing');
text = text.replaceAll(obj, objAdd);

writeFileSync(p, text);
console.log('patched', p);
console.log('classic/home present:', text.includes('/classic/home'));
