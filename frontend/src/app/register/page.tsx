"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  FormError,
  PrimaryButton,
  Select,
  TextInput,
} from "@/components/form-controls";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage } from "@/lib/apiClient";
import {
  firstIssue,
  registerSchema,
  type RegisterData,
} from "@/lib/schemas";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
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
      // Registering sets no cookie by design, so the user signs in first. That step
      // is explicit rather than automatic because it mirrors the API contract.
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-base-content/70">
          One account for riding or driving. You can change the story later, not the
          identity.
        </p>
      </div>
      <div className="card bg-base-100 shadow-xl">
        <form className="card-body flex flex-col gap-4" onSubmit={handleSubmit}>
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
          <Select
            label="I want to"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="passenger">Ride as a passenger</option>
            <option value="driver">Drive and share my Tesla</option>
          </Select>
          <FormError>{error}</FormError>
          <PrimaryButton pending={pending}>Create account</PrimaryButton>
        </form>
      </div>
      <p className="text-sm text-base-content/70">
        Already have one?{" "}
        <Link className="link link-primary" href="/login">
          Sign in
        </Link>
      </p>
    </main>
  );
}