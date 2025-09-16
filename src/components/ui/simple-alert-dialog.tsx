"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// Simple AlertDialog implementation without radix-ui
interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextType | null>(
  null
);

const AlertDialog: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

const AlertDialogTrigger: React.FC<{
  children: React.ReactElement;
  asChild?: boolean;
}> = ({ children, asChild }) => {
  const context = React.useContext(AlertDialogContext);
  if (!context)
    throw new Error("AlertDialogTrigger must be used within AlertDialog");

  const handleClick = () => context.setOpen(true);

  if (asChild && React.isValidElement(children)) {
    type Clickable = { onClick?: React.MouseEventHandler<HTMLElement> };
    const child = children as React.ReactElement<Clickable>;
    return React.cloneElement(child, { onClick: handleClick });
  }

  return <div onClick={handleClick}>{children}</div>;
};

const AlertDialogPortal: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const context = React.useContext(AlertDialogContext);
  if (!context || !context.open) return null;

  return <div className="fixed inset-0 z-50">{children}</div>;
};

const AlertDialogOverlay: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    className={cn("fixed inset-0 bg-black/80 animate-in fade-in-0", className)}
  />
);

const AlertDialogContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const context = React.useContext(AlertDialogContext);
  if (!context || !context.open) return null;

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <div
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
      >
        {children}
      </div>
    </AlertDialogPortal>
  );
};

const AlertDialogHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
  >
    {children}
  </div>
);

const AlertDialogFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
  >
    {children}
  </div>
);

const AlertDialogTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
);

const AlertDialogDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
);

const AlertDialogAction: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className, onClick }) => {
  const context = React.useContext(AlertDialogContext);
  if (!context)
    throw new Error("AlertDialogAction must be used within AlertDialog");

  const handleClick = () => {
    onClick?.();
    context.setOpen(false);
  };

  return (
    <button className={cn(buttonVariants(), className)} onClick={handleClick}>
      {children}
    </button>
  );
};

const AlertDialogCancel: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className, onClick }) => {
  const context = React.useContext(AlertDialogContext);
  if (!context)
    throw new Error("AlertDialogCancel must be used within AlertDialog");

  const handleClick = () => {
    onClick?.();
    context.setOpen(false);
  };

  return (
    <button
      className={cn(
        buttonVariants({ variant: "outline" }),
        "mt-2 sm:mt-0",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
