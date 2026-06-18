import { createPortal } from 'react-dom';
import {
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

type Placement = 'top' | 'bottom';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  triggerClassName?: string;
  triggerStyle?: CSSProperties;
  tooltipClassName?: string;
  offset?: number;
  preferredPlacement?: Placement;
  showOnOverflowOnly?: boolean;
  overflowSelector?: string;
}

interface TooltipPosition {
  top: number;
  left: number;
  placement: Placement;
}

const VIEWPORT_PADDING = 8;
const OVERFLOW_TOLERANCE = 1;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isOverflowing(element: Element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  return (
    element.scrollWidth > element.clientWidth + OVERFLOW_TOLERANCE ||
    element.scrollHeight > element.clientHeight + OVERFLOW_TOLERANCE
  );
}

export function Tooltip({
  content,
  children,
  triggerClassName,
  triggerStyle,
  tooltipClassName,
  offset = 8,
  preferredPlacement = 'top',
  showOnOverflowOnly = false,
  overflowSelector,
}: TooltipProps) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [measured, setMeasured] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      setMeasured(false);
      setVisible(false);
    }
  }, [open]);

  function shouldOpen() {
    if (!showOnOverflowOnly) {
      return true;
    }

    const trigger = triggerRef.current;
    if (!trigger) {
      return false;
    }

    const overflowTargets = overflowSelector
      ? Array.from(trigger.querySelectorAll(overflowSelector))
      : [trigger];

    return overflowTargets.some(isOverflowing);
  }

  useEffect(() => {
    if (!measured || !position) {
      setVisible(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [measured, position]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !tooltipRef.current) {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const viewportLeft = scrollX + VIEWPORT_PADDING;
    const viewportRight = scrollX + window.innerWidth - VIEWPORT_PADDING;
    const viewportTop = scrollY + VIEWPORT_PADDING;
    const viewportBottom = scrollY + window.innerHeight - VIEWPORT_PADDING;
    const centeredLeft = scrollX + triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
    const clampedLeft = clamp(centeredLeft, viewportLeft, viewportRight - tooltipRect.width);
    const topPlacement = scrollY + triggerRect.top - tooltipRect.height - offset;
    const bottomPlacement = scrollY + triggerRect.bottom + offset;
    const bottomOverflows = bottomPlacement + tooltipRect.height > viewportBottom;
    const topFits = topPlacement >= viewportTop;
    const placeBelow = preferredPlacement === 'bottom'
      ? !bottomOverflows || !topFits
      : !topFits;

    setPosition({
      left: clampedLeft,
      top: placeBelow
        ? clamp(bottomPlacement, viewportTop, viewportBottom - tooltipRect.height)
        : topPlacement,
      placement: placeBelow ? 'bottom' : 'top',
    });
    setMeasured(true);
  }, [content, offset, open, preferredPlacement]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      if (!triggerRef.current || !tooltipRef.current) {
        return;
      }

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const viewportLeft = scrollX + VIEWPORT_PADDING;
      const viewportRight = scrollX + window.innerWidth - VIEWPORT_PADDING;
      const viewportTop = scrollY + VIEWPORT_PADDING;
      const viewportBottom = scrollY + window.innerHeight - VIEWPORT_PADDING;
      const centeredLeft = scrollX + triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
      const clampedLeft = clamp(centeredLeft, viewportLeft, viewportRight - tooltipRect.width);
      const topPlacement = scrollY + triggerRect.top - tooltipRect.height - offset;
      const bottomPlacement = scrollY + triggerRect.bottom + offset;
      const bottomOverflows = bottomPlacement + tooltipRect.height > viewportBottom;
      const topFits = topPlacement >= viewportTop;
      const placeBelow = preferredPlacement === 'bottom'
        ? !bottomOverflows || !topFits
        : !topFits;

      setPosition({
        left: clampedLeft,
        top: placeBelow
          ? clamp(bottomPlacement, viewportTop, viewportBottom - tooltipRect.height)
          : topPlacement,
        placement: placeBelow ? 'bottom' : 'top',
      });
      setMeasured(true);
    }

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    updatePosition();

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [offset, open, preferredPlacement]);

  return (
    <>
      <div
        ref={triggerRef}
        className={triggerClassName}
        style={triggerStyle}
        onMouseEnter={() => setOpen(shouldOpen())}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(shouldOpen())}
        onBlur={() => setOpen(false)}
      >
        {children}
      </div>
      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className={`portal-tooltip ${position?.placement === 'bottom' ? 'position-bottom' : 'position-top'}${visible ? ' portal-tooltip-visible' : ''}${tooltipClassName ? ` ${tooltipClassName}` : ''}`}
            style={{
              left: position?.left ?? 0,
              top: position?.top ?? 0,
            }}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
