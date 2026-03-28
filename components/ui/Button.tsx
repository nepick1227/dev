import { type ButtonHTMLAttributes, forwardRef } from "react";
import Spinner from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "kakao";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white active:scale-[0.97] disabled:bg-border disabled:text-text-secondary disabled:cursor-not-allowed",
  secondary:
    "bg-bg border border-border text-text-primary active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed",
  kakao:
    "bg-[#FEE500] text-[#191919] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2.5 text-[13px] rounded-xl",
  md: "px-5 py-3.5 text-[15px] rounded-xl",
  lg: "px-6 py-4 text-[16px] rounded-xl",
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
            color={variant === "primary" || variant === "kakao" ? "#fff" : "#D32F2F"}
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
