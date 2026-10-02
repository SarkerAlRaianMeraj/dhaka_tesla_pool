# Project Rules - Frontend (CSC 4182)



## Tech Stack
- **Frontend**: Next.js (React, TypeScript) + App Router
- **Styling**: Tailwind CSS + **daisyUI**
- **HTTP Client**: Axios (only — **no `fetch`**)
- **Validation**: Zod (**no HTML built-in validation**)
- **Backend**: NestJS API at `NEXT_PUBLIC_API_ENDPOINT` (base path `/api/v1`)

---

## Project Setup

- Create with **App Router**, TypeScript, ESLint, Tailwind CSS; **no `src/` directory**:
  ```bash
  npx create-next-app@latest
  ```
  - TypeScript: **Yes** · ESLint: **Yes** · Tailwind: **Yes** · `src/`: **No** · App Router: **Yes**
- Run: `npm run dev` → `http://localhost:3000`
- Change port in `package.json`: `"dev": "next dev --port 7000"`
- `.env` in project root:
  ```
  NEXT_PUBLIC_API_ENDPOINT=http://localhost:3000/api/v1
  ```

### Directory Structure
```
app/
  layout.tsx          # root layout, global nav/footer
  page.tsx            # "/"
  login/page.tsx      # "/login"
  materials/page.tsx  # browse/search
  materials/[id]/page.tsx   # dynamic detail route
  loading.tsx         # loading state
  not-found.tsx       # 404 page
components/
  Layout/
    layout.tsx        # reusable page wrapper
    navbar.tsx
    footer.tsx
lib/
public/
package.json
next.config.ts
tailwind.config.ts
.env
```

---

## TypeScript / ES6 Fundamentals

- Use `const` by default; `let` only for reassignment; **never `var`**
- **Arrow functions**: `const fn = () => {}`
- **Template strings**: `` `Hello ${name}` ``
- **Destructuring**: `const { name, email } = user`
- **Spread operator**: `const arr = [...existing, item]`
- **Array methods**: `.map()`, `.filter()`, `.reduce()`
- **Ternary operator**: `cond ? <A/> : <B/>`
- **async/await** inside `try/catch` for all async operations
- **Modules**: named imports/exports; pages use default exports
- Define types via interfaces or `z.infer`; **no `any`**

---

## React Components

- **Functional components only** (no class components); a component is a function returning JSX:
  ```tsx
  export default function Greeting() {
    return <h1>Hello, world!</h1>;
  }
  ```
- File names: **PascalCase** (e.g., `LoginForm.tsx`)

### Props
- Pass data **parent → child**; props are **read-only** to the child
- Destructure props:
  ```tsx
  function Child({ name, age }: { name: string; age: number }) {
    return <p>{name} is {age} years old</p>;
  }
  ```

### State
- Use `useState` for mutable data; updates trigger re-render:
  ```tsx
  const [count, setCount] = useState(0);
  ```

### JSX Rules
- HTML-like syntax inside TypeScript
- **camelCase** for events/attributes: `onClick`, `className`, `htmlFor` (never `onclick`, `class`, `for`)
- Handlers in curly braces: `onClick={handleClick}` (not `onClick="handleClick()"`)
- Call `e.preventDefault()` in submit handlers

---

## Hooks

- Hooks give functional components state + lifecycle (React 16.8+)
- **Call hooks at the top level** — never in loops, conditions, or nested functions

### useState / useEffect
```tsx
const [email, setEmail] = useState<string>("");

useEffect(() => {
  fetchData();
}, []);            // empty array = run once on mount

useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);       // runs only when `count` changes
```

### Client Components (App Router)
- Add `"use client";` at the top of any component using **state, event handlers, `useEffect`, or browser APIs**
- Default to Server Components; keep client components small and at the leaf of the tree

---

## Routing & Navigation

- **File-based routing**: `app/login/page.tsx` → `/login`
- **Dynamic routes**: `app/materials/[id]/page.tsx` → `/materials/1`
- **Routing files**: `layout.tsx`, `loading.tsx`, `not-found.tsx` (required by assignment)
- **Internal navigation** → `Link` from `next/link`:
  ```tsx
  import Link from "next/link";
  <Link href="/materials">Materials</Link>
  ```
- **External links** → standard `<a href="https://...">`
- **Programmatic navigation** → `useRouter`:
  ```tsx
  import { useRouter } from "next/navigation";
  const router = useRouter();
  router.push("/dashboard");
  router.push({ pathname: "/materials/12", query: { filter: "notes" } });
  ```

---

## Forms & Validation (Zod only)

- **No HTML validation attributes** — all validation via **Zod schemas**
- Install: `npm install zod`
- Every form defines a `z.object({ ... })` schema; type derived with `z.infer`
- Use `safeParse` (never `parse`) — capture `result.error.errors[0].message`

```tsx
"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import { z } from "zod";
import Layout from "@/components/Layout/layout";
import Title from "@/components/Layout/title";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});
type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    console.log(result.data);
    setEmail("");
    setPassword("");
    setError("");
  };

  return (
    <>
      <Title page="Login" />
      <Layout>
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p>{error}</p>}
          <button type="submit">Login</button>
        </form>
      </Layout>
    </>
  );
}
```

- Conditional rendering: `{error && <p>{error}</p>}`

---

## Data Fetching (Axios only)

- **Axios is the only HTTP client — `fetch` is forbidden**
- Install: `npm install axios`
- Always `async/await` + `try/catch`; data lives at `response.data`
- Never hardcode URLs — use `process.env.NEXT_PUBLIC_API_ENDPOINT`

```tsx
const response = await axios.get(process.env.NEXT_PUBLIC_API_ENDPOINT + "/materials");
const response = await axios.get(process.env.NEXT_PUBLIC_API_ENDPOINT + "/materials", { params: { course: "CSC4182" } });
const response = await axios.post(process.env.NEXT_PUBLIC_API_ENDPOINT + "/auth/login", { email, password });
const response = await axios.put(process.env.NEXT_PUBLIC_API_ENDPOINT + "/users/123", data);
const response = await axios.delete(process.env.NEXT_PUBLIC_API_ENDPOINT + "/users/123");
```

### File upload (FormData / multipart)
```tsx
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("title", title);
formData.append("course", course);
await axios.post(process.env.NEXT_PUBLIC_API_ENDPOINT + "/materials", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
```

### Fetch on mount (CSR example)
```tsx
"use client";
useEffect(() => {
  fetchData();
}, []);

async function fetchData() {
  try {
    const response = await axios.get(process.env.NEXT_PUBLIC_API_ENDPOINT + "/materials");
    setJsonData(response.data);
  } catch (error) {
    console.error(error);
  }
}
```

### Rendering response data
```tsx
{jsonData != null && (
  Array.isArray(jsonData) ? printArray(jsonData) : printObject(jsonData)
)}
```
- Render arrays with `.map()` + a `key` prop

---

## Styling (Tailwind CSS + daisyUI)

- **Utility-first** Tailwind classes + **daisyUI** component classes
- Install: `npm install -D tailwindcss postcss autoprefixer daisyui`

```js
// tailwind.config.js
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [require("daisyui")],
}
```

- `globals.css`: `@tailwind base; @tailwind components; @tailwind utilities;`
- Root theme: `<html data-theme="light">`
- Use daisyUI classes for UI elements, Tailwind utilities for spacing/layout:
  ```tsx
  <button className="btn btn-primary">Login</button>
  <input className="input input-bordered w-full" />
  <div className="card bg-base-100 shadow-xl">...</div>
  ```
- Ref: https://daisyui.com/?lang=en
- Do not hand-write CSS where a Tailwind/daisyUI class exists

---

## Authentication & Backend Integration (NestJS)

- Backend enables CORS with credentials:
  ```ts
  app.enableCors({ origin: true, methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS", credentials: true });
  ```
- Axios calls relying on cookies/credentials **must set `withCredentials: true`**:
  ```tsx
  await axios.post(process.env.NEXT_PUBLIC_API_ENDPOINT + "/auth/login",
    { email, password },
    { headers: { "Content-Type": "application/json" }, withCredentials: true });
  ```
- JWT is stored in an httpOnly cookie by the backend — never read it in client JS
- Redirect unauthenticated users with `useRouter().push("/login")` after a 401
- Role-aware UI per the SRS permission matrix (hide admin/mod routes for students/guests)

---

## Rendering Strategy

| Scenario | Strategy | Why |
|----------|----------|-----|
| Blog / marketing / docs / landing pages | **SSG** | Static content, build-time HTML, CDN-friendly, good SEO |
| News feed / fresh data / authenticated pages | **SSR** | HTML generated per request |
| Dashboards / admin panels / search filters | **CSR** | Client state, interactivity, browser APIs |
| Static page + dynamic widget | **SSG + CSR** | Pre-render static parts, fetch dynamic part client-side |
| E-commerce price/stock | **SSR** | Must be fresh on every request |

- Default to Server Components; use `"use client"` only when state/effects/browser APIs are needed

---



## Code Quality

- **ESLint** (from create-next-app) — run `npm run lint` and fix before commit
- **Prettier** for consistent formatting
- Meaningful names (`handleSubmit`, `fetchData`, `LoginForm`)
- No `any` types — interfaces or `z.infer`
- No hardcoded secrets/URLs in source
- Pair with `student/rules.md` (backend) so the NoteVault stack shares conventions