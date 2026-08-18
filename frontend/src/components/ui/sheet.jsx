// src/components/ui/sheet.jsx
// Standard shadcn/ui Sheet — a slide-in panel built on Radix Dialog.
// Used for the mobile nav drawer.

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

function SheetContent({ className, children, open, side = "right", ...props }) {
  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Portal forceMount>
          <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
          </DialogPrimitive.Overlay>
          <DialogPrimitive.Content asChild forceMount {...props}>
            <motion.div
              initial={{ x: side === "right" ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: side === "right" ? "100%" : "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={cn(
                "fixed inset-y-0 z-50 flex h-full w-3/4 max-w-sm flex-col bg-white shadow-xl",
                side === "right" ? "right-0" : "left-0",
                className
              )}
            >
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                <X size={20} />
              </DialogPrimitive.Close>
              {children}
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent };