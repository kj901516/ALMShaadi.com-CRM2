import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-maroon-800 uppercase tracking-wide">{label}</span>
      {children}
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

const inputBase =
  'w-full px-3.5 py-2.5 rounded-lg border border-cream-300 bg-white text-sm text-maroon-950 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} resize-y min-h-[80px] ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ''}`} />;
}

export function SectionTitle({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-2">
      {icon && <span className="text-gold-600">{icon}</span>}
      <h3 className="text-base font-bold text-maroon-800">{children}</h3>
      <div className="flex-1 h-px bg-gradient-to-r from-gold-300 to-transparent" />
    </div>
  );
}
