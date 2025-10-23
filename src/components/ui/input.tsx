import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

const SecuredInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const handleCopy = (e: React.ClipboardEvent) => {
      e.preventDefault();
    };

    const handleCut = (e: React.ClipboardEvent) => {
      e.preventDefault();
    };

    const handleSelect = (e: React.SyntheticEvent) => {
      e.preventDefault();
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
    };

    const handleDragStart = (e: React.DragEvent) => {
      e.preventDefault();
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm select-none pointer-events-auto",
          className
        )}
        ref={ref}
        autoComplete="off"
        spellCheck={false}
        style={{ userSelect: 'none' }}
        onCopy={handleCopy}
        onCut={handleCut}
        onSelect={handleSelect}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        {...props}
      />
    );
  }
);
SecuredInput.displayName = "SecuredInput"

export { Input, SecuredInput }
