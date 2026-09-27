import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, rightElement, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.replace(/\s/g, "-").toLowerCase();

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[14px] font-semibold text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={[
              "h-[52px] w-full rounded-[12px] border-[1.5px] bg-surface px-[15px] text-[15px] text-text-primary outline-none transition-colors duration-200",
              "placeholder:text-text-muted",
              error
                ? "border-primary focus:border-primary"
                : "border-border focus:border-primary",
              rightElement ? "pr-11" : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightElement}</div>
          )}
        </div>
        {error && (
          <p className="text-[12.5px] font-semibold text-primary">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[12.5px] font-semibold text-text-description">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
