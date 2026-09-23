import { type ChangeEvent, type TextareaHTMLAttributes, forwardRef } from "react";
import { validation } from "@/styles/tokens";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  maxLength?: number;
  currentLength?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, maxLength, currentLength, className = "", id, onChange, ...props }, ref) => {
    const textareaId = id ?? label?.replace(/\s/g, "-").toLowerCase();
    const limit = maxLength ?? validation.comment.max;
    const count = currentLength ?? 0;
    const isOverLimit = count > limit;

    // IME 조합·붙여넣기로 maxLength를 우회해 한도를 넘는 경우까지 하드 캡
    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      if (e.target.value.length > limit) {
        e.target.value = e.target.value.slice(0, limit);
      }
      onChange?.(e);
    };

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[14px] font-semibold text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            maxLength={limit}
            onChange={handleChange}
            className={[
              "min-h-[52px] w-full resize-none rounded-[12px] border-[1.5px] bg-surface p-[14px] text-[14px] text-text-primary outline-none transition-colors duration-200",
              "placeholder:text-text-muted",
              error || isOverLimit
                ? "border-primary focus:border-primary"
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
            "text-[12.5px] font-semibold",
            error ? "text-primary" : "text-text-description",
          ].join(" ")}>
            {error ?? hint ?? ""}
          </p>
          <span className={[
            "shrink-0 text-[12.5px] font-semibold",
            isOverLimit ? "text-primary" : "text-text-description",
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
