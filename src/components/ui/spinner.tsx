import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: number;
  label?: string;
  className?: string;
  fullHeight?: boolean;
}

export function Spinner({
  size = 40,
  label,
  className,
  fullHeight = false,
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullHeight && "min-h-[300px]",
        className,
      )}
    >
      <div className="spinner" style={{ width: size, height: size }}>
        <div className="double-bounce1" />
        <div className="double-bounce2" />
      </div>
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
      <span className="sr-only">{label ?? "Carregando..."}</span>
    </div>
  );
}
