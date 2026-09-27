import { type ButtonHTMLAttributes, forwardRef } from "react";
import Spinner from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "kakao";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary font-[800] text-white shadow-[0_6px_16px_rgba(211,47,47,0.32)] active:scale-[0.97] disabled:bg-disabled-bg disabled:text-disabled-text disabled:shadow-none disabled:cursor-not-allowed",
  secondary:
    "border-[1.5px] border-border bg-surface font-bold text-text-body active:scale-[0.97] disabled:bg-disabled-bg disabled:text-disabled-text disabled:cursor-not-allowed",
  danger:
    "border-[1.5px] border-primary bg-surface font-bold text-primary active:scale-[0.97] disabled:border-disabled-bg disabled:bg-disabled-bg disabled:text-disabled-text disabled:cursor-not-allowed",
  ghost:
    "bg-transparent font-semibold text-text-tertiary hover:text-text-primary active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed",
  kakao:
    "bg-[#FEE500] font-bold text-[#191919] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm:  "h-10 px-4 text-[13px] rounded-[10px]",
  md:  "h-12 px-[26px] text-[15px] rounded-[13px]",
  lg:  "h-[52px] px-7 text-[15px] rounded-[14px]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "lg",
      isLoading = false,
      fullWidth = false,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={[
          "flex items-center justify-center gap-2 transition-all duration-200",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {isLoading ? (
          <Spinner
            color={variant === "primary" || variant === "danger" || variant === "kakao" ? "#fff" : "var(--color-primary)"}
            size={18}
          />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
