import { type TextareaHTMLAttributes, forwardRef } from "react";
import { validation } from "@/styles/tokens";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  maxLength?: number;
  currentLength?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, maxLength, currentLength, className = "", id, ...props }, ref) => {
    const textareaId = id ?? label?.replace(/\s/g, "-").toLowerCase();
    const limit = maxLength ?? validation.comment.max;
    const count = currentLength ?? 0;
    const isOverLimit = count > limit;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[14px] font-semibold tracking-tight text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            maxLength={limit}
            className={[
              "w-full rounded-2xl border-[1.5px] bg-surface px-5 py-4 text-[16px] tracking-tight text-text-primary outline-none transition-colors duration-200 resize-none",
              "placeholder:text-text-tertiary",
              error || isOverLimit
                ? "border-primary-dark focus:border-primary-dark"
                : "border-border focus:border-primary",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
        </div>
        <div className="flex items-start justify-between gap-2">
          <p className={[
            "text-[13px] tracking-tight",
            error ? "text-primary-dark" : "text-text-secondary",
          ].join(" ")}>
            {error ?? hint ?? ""}
          </p>
          <span className={[
            "shrink-0 text-[13px] tracking-tight",
            isOverLimit ? "text-primary-dark" : "text-text-secondary",
          ].join(" ")}>
            {count}/{limit}
          </span>
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
