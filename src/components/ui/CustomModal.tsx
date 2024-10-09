"use client";

import { useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./Dialog";
import { cn } from "../../../lib/utils";

interface CustomModalProps {
  open: boolean;
  onOpenChange: any;
  children: any;
  className?: string;
}
const CustomModal = ({
  open,
  onOpenChange,
  children,
  className,
}: CustomModalProps) => {
  useEffect(() => {
    if (open) {
      document.body.classList.add("!m-0");
      document.body.classList.add("!overflow-y-auto");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger />
      <DialogContent className={cn(className)}>{children}</DialogContent>
    </Dialog>
  );
};

export default CustomModal;
