"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

/**
 * Context provided by DialogContent so that BSCalendarSelector can:
 *  - portal its popover into a DOM node that is INSIDE the focus trap
 *    (so the year input can receive focus / keyboard input)
 *  - know the dialog content element's bounding rect so it can adjust
 *    `position: fixed` coordinates (the dialog element has a CSS transform
 *    which makes it the containing block for fixed-position descendants)
 */
export interface DialogCalendarContextValue {
  /** createPortal target – lives inside DialogPrimitive.Content (inside focus trap) */
  container: HTMLElement | null;
  /** The dialog content DOM element. Used to adjust fixed-position coordinates. */
  dialogContentEl: HTMLElement | null;
}

export const DialogCalendarPortalContext =
  React.createContext<DialogCalendarContextValue>({ container: null, dialogContentEl: null });

/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */

/**
 * DialogContent with built-in support for BSCalendarSelector.
 *
 * Key changes from default shadcn DialogContent:
 *  1. Renders a zero-size "calendar portal container" div as a child of
 *     DialogPrimitive.Content so BSCalendarSelector portals live inside
 *     the Radix focus trap (enabling keyboard/focus interaction on the
 *     year input and month selector inside the popover).
 *  2. Exports `dialogContentEl` via context so BSCalendarSelector can
 *     compensate for the dialog's `translate-x[-50%] translate-y[-50%]`
 *     transform when calculating `position: fixed` coordinates.
 *  3. Handles onInteractOutside / onPointerDownOutside / onFocusOutside
 *     to prevent the dialog from closing when the calendar is open.
 */
const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, onInteractOutside, onPointerDownOutside, onFocusOutside, ...props }, ref) => {
  // Container div that receives calendar portals (inside the focus trap)
  const [calendarContainer, setCalendarContainer] = React.useState<HTMLDivElement | null>(null);
  // The dialog content element itself (needed for coord adjustment)
  const [dialogContentEl, setDialogContentEl] = React.useState<HTMLElement | null>(null);

  // Merge the forwarded ref with our state setter
  const mergedRef = React.useCallback(
    (el: HTMLDivElement | null) => {
      setDialogContentEl(el);
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    },
    [ref],
  );

  /** Returns true when a Radix "outside" event targets an element inside the BS calendar popover */
  const isBsCalendarTarget = (e: Event) => {
    const orig = (e as any).detail?.originalEvent;
    const candidates: (HTMLElement | null | undefined)[] = [
      orig?.target,
      orig?.relatedTarget,
      (e as any).target,
    ];
    return candidates.some((el) => (el as HTMLElement | null)?.closest?.("[data-bs-calendar]"));
  };

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogCalendarPortalContext.Provider value={{ container: calendarContainer, dialogContentEl }}>
        <DialogPrimitive.Content
          ref={mergedRef}
          onInteractOutside={(e) => {
            if (isBsCalendarTarget(e)) { e.preventDefault(); return; }
            onInteractOutside?.(e);
          }}
          onPointerDownOutside={(e) => {
            if (isBsCalendarTarget(e)) { e.preventDefault(); return; }
            onPointerDownOutside?.(e);
          }}
          onFocusOutside={(e) => {
            if (isBsCalendarTarget(e)) { e.preventDefault(); return; }
            onFocusOutside?.(e);
          }}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
            className,
          )}
          {...props}
        >
          {children}

          {/*
           * Zero-size anchor for BSCalendarSelector portals.
           * Being a child of DialogPrimitive.Content means it is inside
           * the Radix FocusScope, so the year <input> can be focused and
           * typed into without the focus trap returning focus to the dialog.
           * position:fixed takes it out of the grid flow so it doesn't
           * affect the dialog layout.
           */}
          <div
            ref={setCalendarContainer}
            style={{ position: "fixed", width: 0, height: 0, overflow: "visible", zIndex: 9998, pointerEvents: "none" }}
          />
        </DialogPrimitive.Content>
      </DialogCalendarPortalContext.Provider>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

/* ------------------------------------------------------------------ */

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
