import type { ComponentProps, ReactNode } from "react";

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "ghost" | "danger" | "onDark";
type Size = "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-forest text-on-forest hover:bg-forest-deep",
  secondary: "border border-line bg-surface text-ink hover:border-forest hover:text-forest",
  ghost: "text-ink hover:bg-line/50",
  danger: "bg-danger text-white hover:brightness-90",
  onDark: "bg-on-forest text-forest-deep hover:bg-white",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150",
    "disabled:opacity-50 active:translate-y-px",
    size === "md" ? "min-h-11 px-4 py-2 text-[15px]" : "min-h-9 px-3 py-1.5 text-sm",
    VARIANTS[variant],
    extra,
  );
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

const FIELD =
  "w-full min-h-11 rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink " +
  "placeholder:text-muted/70 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/25";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(FIELD, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(FIELD, "font-mono text-sm", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(FIELD, className)} {...props} />;
}

export function Field({
  label,
  name,
  error,
  help,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-semibold">
        {label}
      </label>
      {children}
      {help && !error && <p className="text-sm text-muted">{help}</p>}
      {error && (
        <p id={`${name}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "forest" | "copper" | "success";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-line/60 text-ink",
    forest: "bg-forest/10 text-forest",
    copper: "bg-copper/10 text-copper",
    success: "bg-success-soft text-success",
  };
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-line bg-surface", className)} {...props} />;
}

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...props} />;
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="py-8 sm:py-10">
      <h1 className="text-3xl sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-muted">{description}</p>}
    </header>
  );
}
