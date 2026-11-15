import { forwardRef } from "react";
import type { ReactNode, TextareaHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  footer?: ReactNode;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, footer, rows = 4, ...props }, ref) {
    return (
      <div className="relative min-w-0">
        <textarea
          {...props}
          ref={ref}
          rows={rows}
          className={twMerge(
            "max-h-80 w-full resize-y overflow-auto rounded-md border border-border-light bg-controlBackground-light p-3 text-sm text-content-light focus:border-border-light focus:ring-1 focus:ring-border-light dark:border-border-dark dark:bg-background-dark dark:text-content-dark dark:focus:border-border-dark dark:focus:ring-border-dark",
            footer != null && "pb-10",
            className
          )}
        />
        {footer != null && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded bg-controlBackground-light px-1 dark:bg-background-dark">
            {footer}
          </div>
        )}
      </div>
    );
  }
);
