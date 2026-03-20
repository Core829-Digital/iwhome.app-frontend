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
      // z-[200] ensures the overlay sits above the sidebar (z-[145]) and any other
      // fixed UI so the entire screen — including the sidebar — dims when a dialog opens.
      "fixed inset-0 z-[200] bg-black/75 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
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
        // z-[201]: above the overlay (z-[200]) and the sidebar (z-[145]).
        // left-[50%]: CSS fallback only — overridden by the sidebar-aware inline style below.
        // max-h-[80dvh] + overflow-y-auto: sensible height defaults, overridable by
        //   consumer via their own max-h-* class (Tailwind last-class-wins).
        "fixed left-[50%] z-[201] grid w-full max-w-lg max-h-[80dvh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      style={{
        // ── Vertical ────────────────────────────────────────────────────────────────
        // Shift center down by half the fixed navbar height so the dialog is visually
        // symmetric in the content area below the header (not centred behind it).
        // --private-header-h: 76px in private area (set by VerticalMenu), 0px elsewhere.
        top: 'calc(50% + var(--private-header-h, 0px) / 2)',
        // ── Horizontal centering ────────────────────────────────────────────────────
        // Center the dialog inside the content area (right of sidebar), not the full
        // viewport.  (100vw + sidebar-w) / 2 is the midpoint of [sidebar-w … 100vw].
        // translateX(-50%) then shifts left by half the dialog's own width, giving
        // perfect visual balance within the available canvas.
        // --sidebar-w: 0px mobile | 80px collapsed | 280px expanded (set by VerticalMenu).
        left: 'calc((100vw + var(--sidebar-w, 0px)) / 2)',
        // ── Width ────────────────────────────────────────────────────────────────────
        // Hard-coded via inline style so it always beats any max-w-* Tailwind class,
        // regardless of tailwind-merge conflict-resolution behaviour.
        //   • inner cap: content-area-width minus 3rem total gutter (1.5rem per side)
        //   • outer cap: 26rem (416px) — compact, focused, never overwhelming
        // On mobile (sidebar=0): min(100vw − 3rem, 26rem) → tight gutters
        // On desktop:            the 26rem cap kicks in well before the gutter limit
        // Consumer pages can override both maxWidth and left by passing style={{ … }}
        maxWidth: 'min(calc(100vw - var(--sidebar-w, 0px) - 3rem), 26rem)',
        // Consumer style always wins (spread last).
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
