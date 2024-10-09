import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../../lib/utils";



const buttonVariants = cva(
  "inline-flex w-max items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gray-200 text-white font-bold text-sm leading-5 disabled:bg-gray-400/30 disabled:text-gray-700",
        secondary: "bg-gray-400/20 text-gray-200 font-bold text-sm leading-5",
        outline: "font-bold leading-4 text-sm text-gray-200",
        basic: "bg-transparent text-gray-200 font-bold text-sm leading-5",
        link: "text-gray-200 underline text-sm leading-4 font-bold underline-offset-2",
        icon: "flex items-center justify-center",
      },
      size: {
        default: "px-5 py-3 rounded-full",
        sm: "rounded-full px-3 py-2",
        lg: "h-10 rounded-md px-8",
        icon: "rounded-full p-0",
        basic: "p-0 rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
