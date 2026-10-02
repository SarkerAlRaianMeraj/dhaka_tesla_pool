import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

/**
 * Presentational form controls shared by the sign-in and sign-up screens.
 *
 * No validation attributes are set here on purpose: `frontend/rules.md` requires
 * every rule to live in a Zod schema, so `required`, `minLength`, and `pattern`
 * are absent by design and the schema message is what the user sees.
 */

const fieldClasses =
  "input input-bordered w-full bg-base-100 text-base-content";

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "required"> & {
  label: string;
  hint?: ReactNode;
};

export const TextInput = ({ label, hint, id, ...input }: TextInputProps) => {
  const inputId = id ?? input.name;
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-base-content"
      >
        {label}
      </label>
      <input id={inputId} {...input} className={fieldClasses} />
      {hint ? <p className="text-xs text-base-content/60">{hint}</p> : null}
    </div>
  );
};

type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "required"
> & {
  label: string;
  children: ReactNode;
};

export const Select = ({ label, id, children, ...select }: SelectProps) => {
  const selectId = id ?? select.name;
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-base-content"
      >
        {label}
      </label>
      <select id={selectId} {...select} className={fieldClasses}>
        {children}
      </select>
    </div>
  );
};

export const FormError = ({ children }: { children?: ReactNode }) => {
  if (!children) return null;
  return (
    <p role="alert" className="alert alert-error text-sm">
      {children}
    </p>
  );
};

export const PrimaryButton = ({
  children,
  pending,
}: {
  children: ReactNode;
  pending?: boolean;
}) => (
  <button type="submit" disabled={pending} className="btn btn-primary w-full">
    {pending ? "Working..." : children}
  </button>
);