import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-colors disabled:opacity-40 disabled:pointer-events-none rounded-full",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-paper hover:bg-ink-2",
        brand:
          "bg-brand text-white hover:bg-brand-2",
        outline:
          "border border-line-strong text-ink hover:bg-paper-2",
        ghost: "text-ink hover:bg-paper-2",
        soft: "bg-brand-wash text-brand hover:bg-brand-soft",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-[15px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export function Button({
  className,
  variant,
  size,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(buttonStyles({ variant, size }), className)} {...props}>
      {children}
    </button>
  );
}
