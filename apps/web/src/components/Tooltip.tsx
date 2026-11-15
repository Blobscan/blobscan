import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingArrow,
  arrow,
  useMergeRefs,
  useTransitionStyles,
} from "@floating-ui/react";
import { useReducedMotion } from "@react-spring/web";
import classNames from "classnames";

type TooltipOptions = {
  children: ReactNode;
  onChange?: (isOpen: boolean) => void;
};

function useTooltip({ onChange }: TooltipOptions) {
  const [isOpen, setIsOpen] = useState(false);

  const arrowRef = useRef(null);

  const data = useFloating({
    placement: "top",
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
  });

  const context = data.context;

  const hover = useHover(context, {
    move: false,
    delay: { open: 0, close: 0 },
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const interactions = useInteractions([hover, focus, dismiss, role]);

  useEffect(() => {
    if (onChange) {
      onChange(isOpen);
    }
  }, [isOpen, onChange]);

  return useMemo(
    () => ({
      isOpen,
      setIsOpen,
      ...interactions,
      ...data,
      arrowRef,
    }),
    [isOpen, setIsOpen, interactions, data, arrowRef]
  );
}

type ContextType = ReturnType<typeof useTooltip> | null;

const TooltipContext = createContext<ContextType>(null);

export const useTooltipContext = () => {
  const context = useContext(TooltipContext);

  if (context == null) {
    throw new Error("Tooltip components must be wrapped in <Tooltip />");
  }

  return context;
};

export function Tooltip(options: TooltipOptions) {
  const tooltip = useTooltip(options);

  return (
    <TooltipContext.Provider value={tooltip}>
      {options.children}
    </TooltipContext.Provider>
  );
}

export const TooltipTrigger = forwardRef<
  HTMLElement,
  React.HTMLProps<HTMLElement> & { asChild?: boolean }
>(function TooltipTrigger({ children, asChild = false, ...props }, propRef) {
  const context = useTooltipContext();

  const childrenRef =
    isValidElement(children) && "ref" in children
      ? (children.ref as React.Ref<HTMLElement>)
      : null;

  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  if (asChild && isValidElement(children)) {
    return cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...props,
        ...children.props,
        "data-state": context.isOpen ? "open" : "closed",
      })
    );
  }

  return (
    <button
      type="button"
      ref={ref}
      data-state={context.isOpen ? "open" : "closed"}
      {...context.getReferenceProps(props)}
    >
      {children}
    </button>
  );
});

export const TooltipContent = forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement> & { heading?: ReactNode }
>(function TooltipContent(
  { style, className, heading, children, ...props },
  propRef
) {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);
  const reducedMotion = useReducedMotion();
  const { isMounted, styles: transitionStyles } = useTransitionStyles(
    context.context,
    {
      duration: reducedMotion ? 0 : { open: 200, close: 120 },
      initial: ({ side }) => ({
        opacity: 0,
        transform: reducedMotion
          ? "none"
          : {
              top: "translateY(6px) scale(0.98)",
              bottom: "translateY(-6px) scale(0.98)",
              left: "translateX(6px) scale(0.98)",
              right: "translateX(-6px) scale(0.98)",
            }[side],
      }),
      open: { opacity: 1, transform: "none" },
      common: ({ side }) => ({
        transformOrigin: {
          top: "bottom",
          bottom: "top",
          left: "right",
          right: "left",
        }[side],
        transitionTimingFunction: context.isOpen
          ? "cubic-bezier(0.16, 1, 0.3, 1)"
          : "cubic-bezier(0.4, 0, 1, 1)",
      }),
    }
  );

  if (!isMounted) {
    return null;
  }

  return (
    <FloatingPortal>
      <div
        ref={ref}
        className={classNames(
          "z-50 max-w-[min(280px,calc(100vw-16px))]",
          className
        )}
        style={{
          ...context.floatingStyles,
          ...style,
          pointerEvents: context.isOpen ? style?.pointerEvents : "none",
        }}
        {...context.getFloatingProps(props)}
        aria-hidden={!context.isOpen || undefined}
        data-state={context.isOpen ? "open" : "closed"}
      >
        <div
          style={transitionStyles}
          className="relative rounded-[10px] border border-t-[3px] border-border-light border-t-accent-light bg-surface-light px-4 py-3 text-xs font-normal leading-relaxed text-contentSecondary-light shadow-lg motion-reduce:!transform-none motion-reduce:!transition-none dark:border-border-dark dark:border-t-accent-dark dark:bg-surface-dark dark:text-contentSecondary-dark dark:shadow-lg dark:shadow-black/40"
        >
          {heading && (
            <div className="mb-1 font-medium text-content-light dark:text-content-dark">
              {heading}
            </div>
          )}
          <div className="[overflow-wrap:anywhere]">{children}</div>
          <FloatingArrow
            ref={context.arrowRef}
            context={context.context}
            width={12}
            height={6}
            stroke="currentColor"
            strokeWidth={1}
            className="fill-surface-light text-border-light dark:fill-surface-dark dark:text-border-dark"
          />
        </div>
      </div>
    </FloatingPortal>
  );
});
