import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-slate-400 selection:bg-primary selection:text-primary-foreground flex h-11 w-full min-w-0 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium hover:border-blue-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
