"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef((/** @type {any} */ { className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef((/** @type {any} */ { className, children, style, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // left-[50%] is intentionally omitted — overridden by the inline style below
        // so dialogs center within the actual content area (sidebar + header aware)
        "fixed top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      style={{
        /**
         * Center the dialog within the AVAILABLE content area, not the full viewport.
         *
         * --sidebar-w        : set by VerticalMenu (0px on mobile, 80/280px on desktop)
         * --private-header-h : set by VerticalMenu (76px in private area, else 0px)
         * --sat / --sab      : safe-area-inset-top/bottom (set in index.css)
         * --sal / --sar      : safe-area-inset-left/right
         *
         * left  : shift the 50%-anchor right by half the sidebar width → dialog center
         *         lands in the middle of the visible content area horizontally.
         *
         * top   : shift the 50%-anchor down by half the header height → dialog center
         *         lands in the middle of the area below the fixed top navbar.
         *
         * width : set to the full available content-area width (minus safe-area insets
         *         and 2rem breathing room). Because inline `width` is overridden by
         *         the element's `max-width`, each dialog's Tailwind max-w-* class still
         *         governs the actual rendered width — this value only acts as the
         *         "desired width" that gets capped by max-w-sm / max-w-lg / max-w-2xl
         *         etc. in the consumer className. On mobile it also adds automatic
         *         horizontal gutters (1rem each side) which was missing from `w-full`.
         *
         * maxHeight : prevent dialogs from extending below the viewport, accounting for
         *             the fixed header and safe-area insets.
         */
        left: 'calc(50% + var(--sidebar-w, 0px) / 2)',
        top: 'calc(50% + var(--private-header-h, 0px) / 2)',
        width: 'calc(100vw - var(--sidebar-w, 0px) - var(--sal, 0px) - var(--sar, 0px) - 2rem)',
        maxHeight: 'calc(100dvh - var(--private-header-h, 0px) - var(--sat, 0px) - var(--sab, 0px) - 2rem)',
        overflowY: 'auto',
        // Consumer-provided style always wins (spread last)
        ...style,
      }}
      {...props}>
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = (/** @type {any} */ {
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = (/** @type {any} */ {
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef((/** @type {any} */ { className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef((/** @type {any} */ { className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
