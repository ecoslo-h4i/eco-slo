"use client";

import { X } from "lucide-react";
import {
  Children,
  createContext,
  createElement,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ModalContextValue = {
  contentId: string;
  contentRef: MutableRefObject<HTMLDivElement | null>;
  descriptionId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  triggerRef: MutableRefObject<HTMLElement | null>;
};

type ModalProps = {
  children?: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

type ModalTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

type ModalContentProps = HTMLAttributes<HTMLDivElement> & {
  closeOnOverlayClick?: boolean;
  initialFocus?: "content" | "firstFocusable";
  showCloseButton?: boolean;
  widthClassName?: string;
};

type ModalCloseProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

const ModalContext = createContext<ModalContextValue | null>(null);

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (!ref) return;

  if (typeof ref === "function") {
    ref(node);
    return;
  }

  (ref as MutableRefObject<T | null>).current = node;
}

function useModalContext(componentName: string) {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error(`${componentName} must be used within Modal.`);
  }

  return context;
}

function focusWithoutScroll(element: HTMLElement | null) {
  if (!element) return;

  element.focus({ preventScroll: true });
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      [
        "a[href]",
        "button:not([disabled])",
        "textarea:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ].join(","),
    ),
  ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
}

function getSingleElementChild(children: ReactNode, componentName: string) {
  const child = Children.only(children);

  if (!isValidElement(child)) {
    throw new Error(`${componentName} with asChild requires a single valid React element child.`);
  }

  return child as ReactElement<{
    onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  }>;
}

const Modal = ({ children, defaultOpen = false, onOpenChange, open: controlledOpen }: ModalProps) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentId = useId();
  const titleId = useId();
  const descriptionId = useId();
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

  return (
    <ModalContext.Provider
      value={{
        contentId,
        contentRef,
        descriptionId,
        open,
        setOpen,
        titleId,
        triggerRef,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

const ModalTrigger = forwardRef<HTMLButtonElement, ModalTriggerProps>(function ModalTrigger(
  { asChild = false, children, onClick, type = "button", ...props },
  forwardedRef,
) {
  const { contentId, open, setOpen, triggerRef } = useModalContext("ModalTrigger");
  const setTriggerRefs = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      assignRef(forwardedRef, node as HTMLButtonElement | null);
    },
    [forwardedRef, triggerRef],
  );
  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      onClick?.(event);

      if (event.defaultPrevented) return;
      setOpen(true);
    },
    [onClick, setOpen],
  );

  if (asChild) {
    const child = getSingleElementChild(children, "ModalTrigger");

    // eslint-disable-next-line react-hooks/refs -- Slot-style children can carry refs; this component does not read them.
    return createElement(child.type, {
      ...child.props,
      ...props,
      "aria-controls": contentId,
      "aria-expanded": open,
      "data-state": open ? "open" : "closed",
      onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
        triggerRef.current = event.currentTarget;
        child.props.onClick?.(event);
        handleClick(event);
      },
    });
  }

  return (
    <button
      aria-controls={contentId}
      aria-expanded={open}
      data-state={open ? "open" : "closed"}
      onClick={handleClick}
      ref={(node) => setTriggerRefs(node)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
});

const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(function ModalContent(
  {
    children,
    className,
    closeOnOverlayClick = true,
    initialFocus = "content",
    onClick,
    onKeyDown,
    showCloseButton = true,
    widthClassName = "w-full max-w-lg",
    ...props
  },
  forwardedRef,
) {
  const { contentId, contentRef, descriptionId, open, setOpen, titleId, triggerRef } = useModalContext("ModalContent");
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
  const closeAndRestoreFocus = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => focusWithoutScroll(triggerRef.current));
  }, [setOpen, triggerRef]);
  const handleOverlayClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (!closeOnOverlayClick) return;

      closeAndRestoreFocus();
    },
    [closeAndRestoreFocus, closeOnOverlayClick],
  );
  const handleContentClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      onClick?.(event);
    },
    [onClick],
  );
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);

      if (event.defaultPrevented) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeAndRestoreFocus();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements(contentRef.current);

      if (!focusableElements.length) {
        event.preventDefault();
        focusWithoutScroll(contentRef.current);
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        focusWithoutScroll(lastElement);
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        focusWithoutScroll(firstElement);
      }
    },
    [closeAndRestoreFocus, contentRef, onKeyDown],
  );

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      const firstFocusableElement = getFocusableElements(contentRef.current)[0];
      focusWithoutScroll(
        initialFocus === "content" ? contentRef.current : (firstFocusableElement ?? contentRef.current),
      );
    });

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [contentRef, initialFocus, open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-text-dark/70 p-4"
      data-state={open ? "open" : "closed"}
      onClick={handleOverlayClick}
    >
      <div
        ref={setContentRefs}
        id={contentId}
        role="dialog"
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        tabIndex={-1}
        data-state={open ? "open" : "closed"}
        className={cn(
          className,
          // Cap to the dynamic viewport so short phone screens scroll the
          // dialog instead of clipping its header/footer.
          "relative max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-border p-4 text-text-dark shadow-lg outline-none md:p-6",
          widthClassName,
        )}
        onClick={handleContentClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <ModalClose
            className="absolute right-4 top-4 rounded-full p-1 text-text-muted transition-colors hover:bg-button-muted hover:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </ModalClose>
        ) : null}
      </div>
    </div>,
    document.body,
  );
});

const ModalClose = forwardRef<HTMLButtonElement, ModalCloseProps>(function ModalClose(
  { asChild = false, children, onClick, type = "button", ...props },
  forwardedRef,
) {
  const { setOpen, triggerRef } = useModalContext("ModalClose");
  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      onClick?.(event);

      if (event.defaultPrevented) return;
      setOpen(false);
      requestAnimationFrame(() => focusWithoutScroll(triggerRef.current));
    },
    [onClick, setOpen, triggerRef],
  );

  if (asChild) {
    const child = getSingleElementChild(children, "ModalClose");

    // eslint-disable-next-line react-hooks/refs -- Slot-style children can carry refs; this component does not read them.
    return createElement(child.type, {
      ...child.props,
      ...props,
      onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
        child.props.onClick?.(event);
        handleClick(event);
      },
    });
  }

  return (
    <button ref={forwardedRef} type={type} onClick={handleClick} {...props}>
      {children}
    </button>
  );
});

const ModalHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)} {...props} />
);

const ModalFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
);

const ModalTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(function ModalTitle(
  { className, ...props },
  forwardedRef,
) {
  const { titleId } = useModalContext("ModalTitle");

  return (
    <h2 ref={forwardedRef} id={titleId} className={cn("text-lg font-semibold leading-none", className)} {...props} />
  );
});

const ModalDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function ModalDescription(
  { className, ...props },
  forwardedRef,
) {
  const { descriptionId } = useModalContext("ModalDescription");

  return <div ref={forwardedRef} id={descriptionId} className={cn("text-sm text-text-muted", className)} {...props} />;
});

Modal.displayName = "Modal";
ModalTrigger.displayName = "ModalTrigger";
ModalContent.displayName = "ModalContent";
ModalClose.displayName = "ModalClose";
ModalHeader.displayName = "ModalHeader";
ModalFooter.displayName = "ModalFooter";
ModalTitle.displayName = "ModalTitle";
ModalDescription.displayName = "ModalDescription";

export { Modal, ModalTrigger, ModalContent, ModalClose, ModalHeader, ModalFooter, ModalTitle, ModalDescription };
