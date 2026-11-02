import { Check } from "lucide-react";

export interface ChoiceOption<T extends string> { value: T; label: string; description?: string }

export function ChoiceGroup<T extends string>({ name, legend, step, options, value, onChange, error }: {
  name: string; legend: string; step: string; options: readonly ChoiceOption<T>[];
  value: T; onChange: (value: T) => void; error?: string;
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined} className="min-w-0">
      <legend className="mb-4 flex items-center gap-3 text-lg font-bold">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">{step}</span>{legend}
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => (
          <label key={option.value} className="relative min-w-0 cursor-pointer">
            <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)}
              className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />
            <span className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-background/50 px-4 py-3 text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary/6 peer-checked:text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-ring">
              <span><span className="block font-semibold">{option.label}</span>{option.description && <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>}</span>
              {value === option.value && <Check aria-hidden="true" className="size-3.5 shrink-0" />}
            </span>
          </label>
        ))}
      </div>
      {error && <p id={`${name}-error`} className="mt-2 text-sm text-primary">{error}</p>}
    </fieldset>
  );
}
