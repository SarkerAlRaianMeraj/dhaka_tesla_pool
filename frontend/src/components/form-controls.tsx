"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

/**
 * Small presentational form controls shared by the sign-in and sign-up screens.
 *
 * Every control shows its own label and error text with a matching `id`, so the
 * error is announced with the field rather than only appearing in a banner.
 */

const fieldClasses =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30 disabled:bg-zinc-100";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
};

export function TextInput({ label, hint, id, ...input }: TextInputProps) {
  const inputId = id ?? input.name;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-800">
        {label}
      </label>
      <input id={inputId} {...input} className={fieldClasses} />
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
};

export function Select({ label, id, children, ...select }: SelectProps) {
  const selectId = id ?? select.name;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-zinc-800">
        {label}
      </label>
      <select id={selectId} {...select} className={fieldClasses}>
        {children}
      </select>
    </div>
  );
}

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {children}
    </p>
  );
}

export function PrimaryButton({
  children,
  pending,
}: {
  children: ReactNode;
  pending?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Working..." : children}
    </button>
  );
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-zinc-600">{subtitle}</p>
      </div>
      <div className="rounded-lg border border-zinc-200 p-6">{children}</div>
      <div className="text-sm text-zinc-600">{footer}</div>
    </main>
  );
}