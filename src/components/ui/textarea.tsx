import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-slate-400 flex field-sizing-content min-h-24 w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-[color,box-shadow,border-color] outline-none hover:border-blue-200 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
