interface McAlertProps {
  type: "error" | "success";
  children: React.ReactNode;
  className?: string;
}

export function McAlert({ type, children, className = "" }: McAlertProps) {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-600",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };

  return (
    <div className={`rounded-[10px] border p-3 text-sm text-center ${styles[type]} ${className}`}>
      {children}
    </div>
  );
}
