import { useEffect, useRef, type ReactNode } from 'react';

export type StepPane = 'input' | 'goals' | 'output';

interface StepPanelProps {
  pane: StepPane;
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
  collapsed?: boolean;
  onCollapsedClick?: () => void;
}

export function StepPanel({ pane, step, title, description, children, collapsed = false, onCollapsedClick }: StepPanelProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLButtonElement>(null);
  const bodyId = `step-${step}-body`;

  useEffect(() => {
    if (!collapsed) {
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && sectionRef.current?.contains(activeElement)) {
      railRef.current?.focus({ preventScroll: true });
    }
  }, [collapsed]);

  return (
    <section
      ref={sectionRef}
      className="step-panel"
      data-pane={pane}
      data-collapsed={collapsed}
      aria-label={title}
    >
      <button
        ref={railRef}
        type="button"
        className="step-panel-collapsed-trigger"
        onClick={onCollapsedClick}
        aria-label={`Expand ${title}`}
        aria-expanded={!collapsed}
        aria-controls={bodyId}
        aria-hidden={!collapsed}
        disabled={!collapsed}
        tabIndex={collapsed ? 0 : -1}
      >
        <div className="step-kicker">Step {step}</div>
        <span className="step-panel-collapsed-title" aria-hidden="true">
          {title}
        </span>
      </button>

      <div
        id={bodyId}
        className="step-panel-expanded-content"
        data-testid="step-panel-body"
        aria-hidden={collapsed}
        inert={collapsed ? true : undefined}
      >
        <div className="step-panel-expanded-inner">
          <div className="step-kicker">Step {step}</div>
          <h2>{title}</h2>
          {description && <p className="step-panel-description">{description}</p>}
          <div>{children}</div>
        </div>
      </div>
    </section>
  );
}
