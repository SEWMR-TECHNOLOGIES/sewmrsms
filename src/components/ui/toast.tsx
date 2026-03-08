import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 right-4 z-[100] flex max-h-screen w-full flex-col gap-3 p-4 md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-xl transition-all",
  {
    variants: {
      variant: {
        default: "border-gray-300 bg-gray-100 text-gray-900",
        success: "border-green-500 bg-green-100 text-green-900",
        destructive: "border-red-500 bg-red-100 text-red-900",
        warning: "border-yellow-500 bg-yellow-100 text-yellow-900",
        info: "border-blue-500 bg-blue-100 text-blue-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type Variant = NonNullable<VariantProps<typeof toastVariants>["variant"]>

const iconsMap: Record<Variant | "default", React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-400" />,
  destructive: <XCircle className="h-5 w-5 text-red-400" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
  info: <Info className="h-5 w-5 text-blue-400" />,
  default: <Info className="h-5 w-5 text-white/70" />,
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, children, open, onOpenChange, ...props }, ref) => {
  // We control mount for Framer Motion with AnimatePresence
  return (
    <AnimatePresence>
      {open ? (
        <ToastPrimitives.Root
          ref={ref}
          open={open}
          onOpenChange={onOpenChange}
          asChild
          {...props}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className={cn(toastVariants({ variant }), className)}
          >
            {iconsMap[(variant as Variant) || "default"]}
            <div className="flex-1 pr-6">
              {children}
              <motion.div
                className="absolute bottom-0 left-0 h-[3px] bg-white/30"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: (props as any)?.duration ?? 4000, ease: "linear" }}
              />
            </div>
            <ToastClose />
          </motion.div>
        </ToastPrimitives.Root>
      ) : null}
    </AnimatePresence>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-white/60 transition hover:text-white focus:outline-none",
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
