import * as React from "react"
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastAction } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? <ToastDescription>{description}</ToastDescription> : null}
            </div>
            {action ? <ToastAction altText="Action">{action}</ToastAction> : null}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
