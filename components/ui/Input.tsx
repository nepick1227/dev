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
            className="text-[14px] font-semibold tracking-tight text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={[
              "w-full rounded-xl border-[1.5px] bg-white px-4 py-3.5 text-[15px] tracking-tight text-text-primary outline-none transition-colors duration-200",
              "placeholder:text-text-secondary",
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
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightElement}</div>
          )}
        </div>
        {error && (
          <p className="text-[12px] tracking-tight text-primary">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[12px] tracking-tight text-text-secondary">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
