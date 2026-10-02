"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  AuthCard,
  FormError,
  PrimaryButton,
  TextInput,
} from "@/components/form-controls";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setPending(true);
    try {
      await login({ email, password });
      // The dashboard decides what to show from the role in the token, so there
      // is no role-specific redirect here to keep in sync.
      router.push("/dashboard");
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
      title="Sign in"
      subtitle="Pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link className="font-medium text-emerald-700 hover:underline" href="/register">
            Create an account
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <TextInput
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextInput
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <FormError>{error}</FormError>
        <PrimaryButton pending={pending}>Sign in</PrimaryButton>
      </form>
    </AuthCard>
  );
}