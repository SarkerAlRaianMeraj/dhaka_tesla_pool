"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  AuthCard,
  FormError,
  PrimaryButton,
  Select,
  TextInput,
} from "@/components/form-controls";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("passenger");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setPending(true);
    try {
      await register({ name, email, password, role });
      // Registering returns no token by design: sign in first, then land on the
      // dashboard. Keeping that step explicit mirrors the API contract.
      router.push("/login?registered=1");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not reach the API. Is the backend running on port 3000?",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Create an account"
      subtitle="One account for riding or driving. You can change the story later, not the identity."
      footer={
        <>
          Already have one?{" "}
          <Link className="font-medium text-emerald-700 hover:underline" href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <TextInput
          label="Name"
          name="name"
          autoComplete="name"
          required
          placeholder="Nusrat Jahan"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextInput
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="nusrat@dhaka.test"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextInput
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint="At least 8 characters."
        />
        <Select
          label="I want to"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
        >
          <option value="passenger">Ride as a passenger</option>
          <option value="driver">Drive and share my Tesla</option>
        </Select>
        <FormError>{error}</FormError>
        <PrimaryButton pending={pending}>Create account</PrimaryButton>
      </form>
    </AuthCard>
  );
}