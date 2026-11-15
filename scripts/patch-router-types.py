from pathlib import Path

p = Path(".expo/types/router.d.ts")
text = p.read_text(encoding="utf-8")

static_routes = [
    "/auth/classic",
    "/classic/home",
    "/classic/tools",
    "/classic/experts",
]

needle = "{ pathname: `/auth/verify-otp`; params?: Router.UnknownInputParams; }"
add = needle + "".join(
    f" | {{ pathname: `{r}`; params?: Router.UnknownInputParams; }}" for r in static_routes
)
add += " | { pathname: `/classic/categories/[slug]`, params: Router.UnknownInputParams & { slug: string | number; } }"
if needle not in text:
    raise SystemExit("input needle missing")
text = text.replace(needle, add, 1)

needle2 = "{ pathname: `/auth/verify-otp`; params?: Router.UnknownOutputParams; }"
add2 = needle2 + "".join(
    f" | {{ pathname: `{r}`; params?: Router.UnknownOutputParams; }}" for r in static_routes
)
add2 += " | { pathname: `/classic/categories/[slug]`, params: Router.UnknownOutputParams & { slug: string; } }"
if needle2 not in text:
    raise SystemExit("output needle missing")
text = text.replace(needle2, add2, 1)

old = (
    "`/auth/verify-otp${`?${string}` | `#${string}` | ''}` | "
    "`/customer${`?${string}` | `#${string}` | ''}`"
)
new = (
    "`/auth/verify-otp${`?${string}` | `#${string}` | ''}` | "
    "`/auth/classic${`?${string}` | `#${string}` | ''}` | "
    "`/classic/home${`?${string}` | `#${string}` | ''}` | "
    "`/classic/tools${`?${string}` | `#${string}` | ''}` | "
    "`/classic/experts${`?${string}` | `#${string}` | ''}` | "
    "`/customer${`?${string}` | `#${string}` | ''}`"
)
if old not in text:
    raise SystemExit("old href template missing")
text = text.replace(old, new, 1)

marker = "| `/auth/verify-otp` | `/customer`"
if marker not in text:
    raise SystemExit("marker missing")
text = text.replace(
    marker,
    "| `/auth/verify-otp` | `/auth/classic` | `/classic/home` | `/classic/tools` | `/classic/experts` | `/customer`",
    1,
)

oldc = "`/categories/${Router.SingleRoutePart<T>}`"
newc = oldc + " | `/classic/categories/${Router.SingleRoutePart<T>}`"
if oldc not in text:
    raise SystemExit("categories dynamic missing")
text = text.replace(oldc, newc, 1)

# Trailing object union for href (InputParams form appears twice — patch both)
obj = "{ pathname: `/categories/[slug]`, params: Router.UnknownInputParams & { slug: string | number; } }"
obj_add = (
    obj
    + " | { pathname: `/classic/categories/[slug]`, params: Router.UnknownInputParams & { slug: string | number; } }"
)
if text.count(obj) < 1:
    raise SystemExit("categories object missing")
text = text.replace(obj, obj_add)

p.write_text(text, encoding="utf-8")
print("patched", p)
print("classic/home present:", "/classic/home" in text)
