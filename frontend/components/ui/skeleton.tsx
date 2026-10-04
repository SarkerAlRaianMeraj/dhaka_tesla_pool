/**
 * Loading placeholder.
 *
 * daisyUI's `skeleton` needs no colour override now that the Kinetic theme supplies
 * `--color-base-300`, so this exists for the shape rather than the palette: a fixed
 * height (an animated block with no height collapses to nothing) and a `title` that a
 * screen reader announces, because a loading state that only pulses conveys nothing
 * to anyone who cannot see it pulse.
 *
 * The `sr-only` label is why `title` is not simply dropped onto the div: `title` is not
 * reliably announced, and a bare `skeleton` reads to assistive tech as an empty box.
 */
export const Skeleton = ({
  className = "h-4 w-full",
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) => (
  <>
    <div className={`skeleton rounded-xl ${className}`.trim()} />
    <span className="sr-only">{label}</span>
  </>
);