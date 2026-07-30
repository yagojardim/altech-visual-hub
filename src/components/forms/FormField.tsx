import * as React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FormFieldState = "default" | "error" | "success";

export interface FormFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  description?: React.ReactNode;
  error?: React.ReactNode;
  success?: React.ReactNode;
  helpText?: React.ReactNode;
  maxLength?: number;
  currentLength?: number;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  state?: FormFieldState;
  className?: string;
  children: React.ReactNode;
}

/**
 * Consolidated wrapper for form controls. Provides label, required marker,
 * help text, error/success messaging, char counter and optional icons.
 * Does not implement validation — purely visual foundation.
 */
export function FormField({
  label,
  htmlFor,
  required,
  description,
  error,
  success,
  helpText,
  maxLength,
  currentLength,
  leadingIcon,
  trailingIcon,
  state,
  className,
  children,
}: FormFieldProps) {
  const resolvedState: FormFieldState = state ?? (error ? "error" : success ? "success" : "default");

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <Label
            htmlFor={htmlFor}
            className={cn(
              "text-sm font-medium text-foreground",
              resolvedState === "error" && "text-destructive",
            )}
          >
            {label}
            {required ? <span className="ml-0.5 text-destructive">*</span> : null}
          </Label>
          {typeof maxLength === "number" ? (
            <span className="text-xs tabular-nums text-muted-foreground">
              {currentLength ?? 0}/{maxLength}
            </span>
          ) : null}
        </div>
      ) : null}

      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}

      <div
        className={cn(
          "relative",
          leadingIcon && "[&_input]:pl-9 [&_button]:pl-9",
          trailingIcon && "[&_input]:pr-9",
        )}
      >
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
            {leadingIcon}
          </span>
        ) : null}
        <div
          className={cn(
            resolvedState === "error" &&
              "[&_input]:border-destructive [&_textarea]:border-destructive [&_button]:border-destructive [&_input]:focus-visible:ring-destructive [&_textarea]:focus-visible:ring-destructive",
            resolvedState === "success" &&
              "[&_input]:border-healthy [&_textarea]:border-healthy [&_button]:border-healthy",
          )}
        >
          {children}
        </div>
        {trailingIcon ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
            {trailingIcon}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="flex items-start gap-1.5 text-xs font-medium text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : success ? (
        <p className="flex items-start gap-1.5 text-xs font-medium text-healthy">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{success}</span>
        </p>
      ) : helpText ? (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      ) : null}
    </div>
  );
}
