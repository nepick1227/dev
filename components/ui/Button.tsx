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
    "bg-primary text-white active:scale-[0.97] disabled:bg-disabled-bg disabled:text-disabled-text disabled:cursor-not-allowed",
  secondary:
    "bg-surface border border-border text-text-primary active:scale-[0.97] disabled:bg-disabled-bg disabled:text-disabled-text disabled:cursor-not-allowed",
  danger:
    "bg-primary-dark text-white active:scale-[0.97] disabled:bg-disabled-bg disabled:text-disabled-text disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed",
  kakao:
    "bg-[#FEE500] text-[#191919] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm:  "h-9  px-4 text-[13px] rounded-[12px]",
  md:  "h-11 px-5 text-[15px] rounded-[14px]",
  lg:  "h-14 px-6 text-[17px] rounded-[18px]",
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
          "flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-200",
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
