"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type DropdownMenuContextValue = {
  contentId: string;
  contentRef: MutableRefObject<HTMLDivElement | null>;
  isKeyboardNavigation: boolean;
  open: boolean;
  setIsKeyboardNavigation: (value: boolean) => void;
  setOpen: (open: boolean) => void;
  triggerRef: MutableRefObject<HTMLElement | null>;
};

type DropdownMenuProps = {
  children?: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

type DropdownMenuTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

type DropdownMenuContentProps = HTMLAttributes<HTMLDivElement> & {
  align?: "center" | "end" | "start";
  sideOffset?: number;
};

type DropdownMenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  inset?: boolean;
};

type DropdownMenuCheckboxItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & {
  checked: boolean;
  checkedIcon?: ReactNode;
  inset?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (!ref) return;

  if (typeof ref === "function") {
    ref(node);
    return;
  }

  (ref as MutableRefObject<T | null>).current = node;
}

function useDropdownMenuContext(componentName: string) {
  const context = useContext(DropdownMenuContext);

  if (!context) {
    throw new Error(`${componentName} must be used within DropdownMenu.`);
  }

  return context;
}

function getMenuItems(container: HTMLDivElement | null) {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll<HTMLElement>('[data-dropdown-menu-item="true"]:not([data-disabled="true"])'),
  );
}

function focusWithoutScroll(element: HTMLElement | null) {
  if (!element) return;

  element.focus({ preventScroll: true });
}

const DropdownMenu = ({ children, defaultOpen = false, onOpenChange, open: controlledOpen }: DropdownMenuProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentId = useId();

  const open = controlledOpen ?? internalOpen;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: globalThis.MouseEvent | globalThis.TouchEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;

      setOpen(false);
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setOpen(false);
      focusWithoutScroll(triggerRef.current);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <DropdownMenuContext.Provider
      value={{
        contentId,
        contentRef,
        isKeyboardNavigation,
        open,
        setIsKeyboardNavigation,
        setOpen,
        triggerRef,
      }}
    >
      {children}
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(function DropdownMenuTrigger(
  { children, className, onClick, onKeyDown, type = "button", ...props },
  forwardedRef,
) {
  const { contentId, open, setIsKeyboardNavigation, setOpen, triggerRef } =
    useDropdownMenuContext("DropdownMenuTrigger");
  const setTriggerRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      assignRef(forwardedRef, node);
    },
    [forwardedRef, triggerRef],
  );
  const handleTriggerClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      onClick?.(event);

      if (event.defaultPrevented) return;
      setIsKeyboardNavigation(false);
      setOpen(!open);
    },
    [onClick, open, setIsKeyboardNavigation, setOpen],
  );
  const handleTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event);

      if (event.defaultPrevented) return;
      if (!["ArrowDown", "Enter", " "].includes(event.key)) return;

      event.preventDefault();
      setIsKeyboardNavigation(true);
      setOpen(true);
    },
    [onKeyDown, setIsKeyboardNavigation, setOpen],
  );

  return (
    <button
      aria-controls={contentId}
      aria-expanded={open}
      aria-haspopup="menu"
      data-state={open ? "open" : "closed"}
      className={className}
      onClick={handleTriggerClick}
      onKeyDown={handleTriggerKeyDown}
      ref={setTriggerRefs}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
});

const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(function DropdownMenuContent(
  { align = "center", children, className, sideOffset = 4, style, onKeyDown, ...props },
  forwardedRef,
) {
  const { contentId, contentRef, isKeyboardNavigation, open, setIsKeyboardNavigation, setOpen, triggerRef } =
    useDropdownMenuContext("DropdownMenuContent");
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const setContentRefs = useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      assignRef(forwardedRef, node);
    },
    [contentRef, forwardedRef],
  );
  const handleContentKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);

      if (event.defaultPrevented) return;
      const items = getMenuItems(contentRef.current);
      const currentIndex = items.findIndex((item) => item === document.activeElement);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setIsKeyboardNavigation(true);
        items[(currentIndex + 1 + items.length) % items.length]?.focus();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setIsKeyboardNavigation(true);
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        setIsKeyboardNavigation(true);
        items[0]?.focus();
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        setIsKeyboardNavigation(true);
        items[items.length - 1]?.focus();
        return;
      }

      if (event.key === "Tab") {
        setOpen(false);
      }
    },
    [contentRef, onKeyDown, setIsKeyboardNavigation, setOpen],
  );

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !contentRef.current) return;

    const contentNode = contentRef.current;
    const focusInitialTarget = () => {
      const items = getMenuItems(contentNode);

      if (isKeyboardNavigation) {
        focusWithoutScroll(items[0] ?? contentNode);
        return;
      }

      focusWithoutScroll(contentNode);
    };

    const updatePosition = () => {
      if (!triggerRef.current || !contentNode) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentNode.getBoundingClientRect();
      const viewportPadding = 8;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const shouldOpenUp = spaceBelow < contentRect.height + sideOffset && spaceAbove > spaceBelow;

      let left = triggerRect.left;

      if (align === "center") {
        left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
      } else if (align === "end") {
        left = triggerRect.right - contentRect.width;
      }

      left = Math.min(Math.max(left, viewportPadding), window.innerWidth - contentRect.width - viewportPadding);

      const top = shouldOpenUp
        ? Math.max(triggerRect.top - contentRect.height - sideOffset, viewportPadding)
        : Math.min(triggerRect.bottom + sideOffset, window.innerHeight - contentRect.height - viewportPadding);

      Object.assign(contentNode.style, {
        ["--dropdown-trigger-width" as string]: `${triggerRect.width}px`,
        left: `${left}px`,
        position: "fixed",
        top: `${top}px`,
        transformOrigin: shouldOpenUp ? "bottom center" : "top center",
        visibility: "visible",
      } satisfies CSSProperties);
    };

    updatePosition();
    focusInitialTarget();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, contentRef, isKeyboardNavigation, open, sideOffset, triggerRef]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={setContentRefs}
      id={contentId}
      role="menu"
      tabIndex={-1}
      data-state={open ? "open" : "closed"}
      className={cn(
        "z-50 min-w-32 overflow-hidden rounded-xl border border-border bg-foreground p-1 text-text-dark shadow-md outline-none",
        className,
      )}
      style={{
        left: 0,
        position: "fixed",
        top: 0,
        visibility: "hidden",
        ...style,
      }}
      onKeyDown={handleContentKeyDown}
      onPointerMove={() => setIsKeyboardNavigation(false)}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
});

const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(function DropdownMenuItem(
  { className, inset, onClick, onKeyDown, disabled, ...props },
  forwardedRef,
) {
  const { isKeyboardNavigation, setOpen, setIsKeyboardNavigation, triggerRef } =
    useDropdownMenuContext("DropdownMenuItem");
  const handleItemClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      onClick?.(event);

      if (event.defaultPrevented) return;
      setIsKeyboardNavigation(false);
      setOpen(false);
      focusWithoutScroll(triggerRef.current);
    },
    [onClick, setIsKeyboardNavigation, setOpen, triggerRef],
  );
  const handleItemKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event);

      if (event.defaultPrevented) return;
      if (!["Enter", " "].includes(event.key)) return;

      event.preventDefault();
      setIsKeyboardNavigation(true);
      event.currentTarget.click();
    },
    [onKeyDown, setIsKeyboardNavigation],
  );

  return (
    <button
      ref={forwardedRef}
      type="button"
      role="menuitem"
      data-disabled={disabled ? "true" : "false"}
      data-dropdown-menu-item="true"
      disabled={disabled}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-lg px-2 py-1.5 text-left text-sm outline-none transition-colors",
        "hover:bg-primary hover:text-text-light disabled:pointer-events-none disabled:opacity-50",
        isKeyboardNavigation && "focus:bg-primary focus:text-text-light",
        inset && "pl-8",
        className,
      )}
      onClick={handleItemClick}
      onKeyDown={handleItemKeyDown}
      onPointerMove={() => setIsKeyboardNavigation(false)}
      {...props}
    />
  );
});

const DropdownMenuCheckboxItem = forwardRef<HTMLButtonElement, DropdownMenuCheckboxItemProps>(
  function DropdownMenuCheckboxItem(
    { checked, checkedIcon, className, inset, onCheckedChange, onClick, onKeyDown, disabled, children, ...props },
    forwardedRef,
  ) {
    const { isKeyboardNavigation, setIsKeyboardNavigation } = useDropdownMenuContext("DropdownMenuCheckboxItem");
    const handleItemClick = useCallback(
      (event: ReactMouseEvent<HTMLButtonElement>) => {
        onClick?.(event);

        if (event.defaultPrevented || disabled) return;
        setIsKeyboardNavigation(false);
        onCheckedChange?.(!checked);
      },
      [checked, disabled, onCheckedChange, onClick, setIsKeyboardNavigation],
    );
    const handleItemKeyDown = useCallback(
      (event: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(event);

        if (event.defaultPrevented) return;
        if (!["Enter", " "].includes(event.key)) return;

        event.preventDefault();
        setIsKeyboardNavigation(true);
        event.currentTarget.click();
      },
      [onKeyDown, setIsKeyboardNavigation],
    );

    return (
      <button
        ref={forwardedRef}
        type="button"
        role="menuitemcheckbox"
        aria-checked={checked}
        data-disabled={disabled ? "true" : "false"}
        data-dropdown-menu-item="true"
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        className={cn(
          "relative flex w-full cursor-default select-none items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm outline-none transition-colors",
          "hover:bg-primary hover:text-text-light disabled:pointer-events-none disabled:opacity-50",
          isKeyboardNavigation && "focus:bg-primary focus:text-text-light",
          inset && "pl-8",
          className,
        )}
        onClick={handleItemClick}
        onKeyDown={handleItemKeyDown}
        onPointerMove={() => setIsKeyboardNavigation(false)}
        {...props}
      >
        <span aria-hidden="true" className="flex h-4 w-4 shrink-0 items-center justify-center">
          {checked ? checkedIcon : null}
        </span>
        <span className="flex-1">{children}</span>
      </button>
    );
  },
);

const DropdownMenuSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function DropdownMenuSeparator(
  { className, ...props },
  forwardedRef,
) {
  return <div ref={forwardedRef} role="separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
});

DropdownMenu.displayName = "DropdownMenu";
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";
DropdownMenuContent.displayName = "DropdownMenuContent";
DropdownMenuItem.displayName = "DropdownMenuItem";
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
};
