"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

/**
 * Context that provides a portal container for BSCalendarSelector when it is
 * rendered inside a Dialog.  The container lives inside the same Radix Portal
 * as the dialog content, but is a sibling of the transformed content element,
 * so `position:fixed` children are positioned relative to the viewport and
 * Radix's DismissableLayer does NOT block pointer events on them.
 */
export const DialogCalendarPortalContext = React.createContext<HTMLElement | null>(null);

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// Internal wrapper that can use hooks (forwardRef callbacks are not hooks-safe
// when the outer component is a plain arrow function).
const DialogContentInner = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, onInteractOutside, onPointerDownOutside, ...props }, ref) => {
  // Container for BSCalendarSelector portals – lives inside the Radix Portal
  // but outside the translated dialog box so fixed-position works correctly.
  const [calendarContainer, setCalendarContainer] = React.useState<HTMLDivElement | null>(null);

  /** Shared guard: prevent dismiss when interacting with a BS calendar popup */
  const isBsCalendarTarget = (e: Event) => {
    const target = (e as any).detail?.originalEvent?.target as HTMLElement | null;
    return !!target?.closest?.("[data-bs-calendar]");
  };

  return (
    <DialogPortal>
      <DialogOverlay />

      {/* Calendar portal container – same Radix portal, no transform, z above overlay */}
      <div
        ref={setCalendarContainer}
        style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }}
      />

      <DialogCalendarPortalContext.Provider value={calendarContainer}>
        <DialogPrimitive.Content
          ref={ref}
          onInteractOutside={(e) => {
            if (isBsCalendarTarget(e)) { e.preventDefault(); return; }
            onInteractOutside?.(e);
          }}
          onPointerDownOutside={(e) => {
            if (isBsCalendarTarget(e)) { e.preventDefault(); return; }
            onPointerDownOutside?.(e);
          }}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
            className,
          )}
          {...props}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogCalendarPortalContext.Provider>
    </DialogPortal>
  );
});
DialogContentInner.displayName = "DialogContent";

const DialogContent = DialogContentInner;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
