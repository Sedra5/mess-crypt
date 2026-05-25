import { tw } from "@/lib/theme";

interface McInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Additional classNames */
  className?: string;
  /** Error message to display and trigger error styling */
  error?: string;
  /** Label to display above the input */
  label?: string;
}

export function McInput({ className = "", error, label, id, ...props }: McInputProps) {
  return (
    <div className="w-full flex flex-col gap-[5px]">
      {label && (
        <label htmlFor={id} className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#7EA898]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${tw.input} ${
          error ? "!border-[#D85A30] focus:!border-[#D85A30] !bg-[#FFF4EC]" : ""
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[12px] text-[#D85A30] mt-1.5 font-medium animate-[fadeUp_0.2s_ease]">{error}</p>
      )}
    </div>
  );
}

interface McTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  label?: string;
}

export function McTextarea({ className = "", label, id, ...props }: McTextareaProps) {
  return (
    <div className="w-full flex flex-col gap-[5px]">
      {label && (
        <label htmlFor={id} className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#7EA898]">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`${tw.input} resize-none ${className}`}
        {...props}
      />
    </div>
  );
}

interface McSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  label?: string;
}

export function McSelect({ className = "", label, id, children, ...props }: McSelectProps) {
  return (
    <div className="w-full flex flex-col gap-[5px]">
      {label && (
        <label htmlFor={id} className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#7EA898]">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`${tw.select} ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
