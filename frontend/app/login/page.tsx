"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  FormError,
  PrimaryButton,
  TextInput,
} from "@/components/form-controls";
import { Layout } from "@/components/Layout/layout";
import { getErrorMessage } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth-context";
import { firstIssue, loginSchema, type LoginData } from "@/lib/schemas";

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(firstIssue(result.error));
      return;
    }

    const data: LoginData = result.data;
    setError(undefined);
    setPending(true);
    try {
      await login(data);
      // The dashboard decides what to render from the role in the cookie, so
      // there is no role-specific redirect here to keep in sync.
      router.push("/dashboard");
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
    <Layout width="narrow">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-base-content/70">
          Pick up where you left off.
        </p>
      </div>
      <div className="card bg-base-100 shadow-xl">
        <form className="card-body flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextInput
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormError>{error}</FormError>
          <PrimaryButton pending={pending}>Sign in</PrimaryButton>
        </form>
      </div>
      <p className="text-sm text-base-content/70">
        New here?{" "}
        <Link className="link link-primary" href="/register">
          Create an account
        </Link>
      </p>
    </Layout>
  );
};

export default LoginPage;