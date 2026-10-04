import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

import { PrimaryAction } from "@/components/ui/button";

/**
 * Presentational form controls shared by the sign-in and sign-up screens.
 *
 * No validation attributes are set here on purpose: `frontend/rules.md` requires
 * every rule to live in a Zod schema, so `required`, `minLength`, and `pattern`
 * are absent by design and the schema message is what the user sees.
 *
 * The colours come from the Kinetic theme in `app/globals.css` rather than from Tailwind
 * utilities on `base-*`, so a field on the sign-in screen and a field in the Tesla
 * registration form are the same field.
 */

/**
 * Shared field chrome: white fill, hairline border, ink text, mint focus ring.
 *
 * Spec §9 asks for a softer treatment than daisyUI's stock input, whose focus ring is a
 * hard 2px offset outline. A single inset ring on mint at low alpha reads calmer and
 * still meets contrast on the label.
 */
const fieldClasses =
  "input input-bordered h-[50px] w-full rounded-2xl border-ink/10 bg-white text-ink placeholder:text-ink/35 focus:border-mint focus:outline-none focus:ring-4 focus:ring-mint/25";

const selectClasses =
  "select select-bordered h-[50px] w-full rounded-2xl border-ink/10 bg-white text-ink focus:border-mint focus:outline-none focus:ring-4 focus:ring-mint/25";

const labelClasses = "font-display text-sm font-semibold text-forest";

const hintClasses = "text-xs text-ink/55";

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "required"> & {
  label: string;
  hint?: ReactNode;
};

export const TextInput = ({ label, hint, id, ...input }: TextInputProps) => {
  const inputId = id ?? input.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className={labelClasses}>
        {label}
      </label>
      <input id={inputId} {...input} className={fieldClasses} />
      {hint ? <p className={hintClasses}>{hint}</p> : null}
    </div>
  );
};

type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "required"
> & {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
};

export const Select = ({
  label,
  id,
  hint,
  children,
  ...select
}: SelectProps) => {
  const selectId = id ?? select.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className={labelClasses}>
        {label}
      </label>
      {/*
       * This used to apply `input input-bordered` to the `<select>`. Those are input
       * classes, so the element was never a daisyUI select at all - it rendered with
       * browser-default chrome and ignored the shared field styling. The ride-request
       * zone, seat and role pickers all went through here, so the redesign is what
       * makes that visible rather than what caused it.
       */}
      <select id={selectId} {...select} className={selectClasses}>
        {children}
      </select>
      {hint ? <p className={hintClasses}>{hint}</p> : null}
    </div>
  );
};

/**
 * A validation failure from the Zod schema.
 *
 * Unframed rather than an `alert` box: spec §8 says internal areas of a panel are not
 * decorative cards, and a full-width red box above a form reads as a system failure
 * rather than "one field needs attention". `role="alert"` carries the same urgency to
 * assistive tech, which is what actually needs to be unmissable.
 */
export const FormError = ({ children }: { children?: ReactNode }) => {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm font-medium text-destructive">
      {children}
    </p>
  );
};

/**
 * The form's submit control.
 *
 * Delegates to the design's `PrimaryAction` so the mint CTA is defined once, but
 * overrides `type="submit"` - a shared action component cannot assume it is a
 * submission, and getting this wrong silently turns a form into a dead button.
 */
export const PrimaryButton = ({
  children,
  pending,
}: {
  children: ReactNode;
  pending?: boolean;
}) => (
  <PrimaryAction type="submit" disabled={pending}>
    {pending ? "Working..." : children}
  </PrimaryAction>
);