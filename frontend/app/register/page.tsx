"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  FormError,
  PrimaryButton,
  TextInput,
} from "@/components/form-controls";
import { AuthShell } from "@/components/Layout/auth-shell";
import { getErrorMessage } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth-context";
import { firstIssue, registerSchema, type RegisterData } from "@/lib/schemas";
import type { Role } from "@/lib/types";

/**
 * The two roles the API accepts, with a line each explaining the consequence.
 *
 * The detail text is why this is not a plain radio pair: "driver" on its own does not
 * tell someone that the Tesla registration flow comes next.
 */
const ROLE_OPTIONS: { value: Role; label: string; detail: string }[] = [
  {
    value: "passenger",
    label: "Ride as a passenger",
    detail: "Request a seat and see the fare before you commit.",
  },
  {
    value: "driver",
    label: "Drive and share my Tesla",
    detail: "Register your Tesla, then see requests that actually fit.",
  },
];

const RegisterPage = () => {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("passenger");
  const [error, setError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const result = registerSchema.safeParse({ name, email, password, role });
    if (!result.success) {
      setError(firstIssue(result.error));
      return;
    }

    const data: RegisterData = result.data;
    setError(undefined);
    setPending(true);
    try {
      await register(data);
      // Registering sets no cookie by design, so the user signs in first. That
      // step is explicit rather than automatic because it mirrors the API
      // contract.
      router.push("/login");
    } catch (caught) {
      setError(
        getErrorMessage(
          caught,
          "Could not reach the API. Is the backend running on port 3000?",
        ),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create an account"
      subtitle="One account for riding or driving. You can change the story later, not the identity."
      footer={
        <>
          Already have one?{" "}
          <Link
            className="font-semibold text-forest underline decoration-mint decoration-2 underline-offset-4 hover:decoration-forest"
            href="/login"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <TextInput
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Nusrat Jahan"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextInput
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nusrat@dhaka.test"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextInput
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 8 characters."
        />
        <RolePicker
          role={role}
          onChange={setRole}
        />
        <FormError>{error}</FormError>
        <PrimaryButton pending={pending}>Create account</PrimaryButton>
      </form>
    </AuthShell>
  );
};

/**
 * The role choice, as two selectable cards rather than a `<select>`.
 *
 * This replaced a dropdown for two reasons. The design language is built from
 * selectable surfaces, and a dropdown hides both options behind a click — for the one
 * decision on this screen that sets up everything after it, showing both is the point.
 * It also means the passenger/driver split is legible before typing anything.
 *
 * It is still two real radio inputs inside a `fieldset` with a `legend`, so keyboard
 * arrow-key navigation, form association and screen-reader grouping all behave the way
 * the platform intends. The visible card is a `<label>`, so the click target is the
 * whole card and there is no custom widget to reimplement.
 *
 * The radios carry no `required` — `frontend/rules.md` keeps every validation rule in
 * the Zod schema, and the selection always has a value because it defaults to
 * passenger.
 */
const RolePicker = ({
  role,
  onChange,
}: {
  role: Role;
  onChange: (role: Role) => void;
}) => (
  <fieldset className="flex flex-col gap-1.5">
    <legend className="font-display text-sm font-semibold text-forest">
      I want to
    </legend>
    <div className="grid gap-2 sm:grid-cols-2">
      {ROLE_OPTIONS.map((option) => {
        const selected = role === option.value;
        return (
          <label
            key={option.value}
            className={`flex cursor-pointer flex-col gap-1 rounded-2xl border px-4 py-3 transition ${
              selected
                ? "border-mint bg-mint/12"
                : "border-ink/10 bg-white hover:border-forest/25"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="font-display text-sm font-semibold text-ink">
              {option.label}
            </span>
            <span className="text-xs text-ink/55">{option.detail}</span>
          </label>
        );
      })}
    </div>
  </fieldset>
);

export default RegisterPage;