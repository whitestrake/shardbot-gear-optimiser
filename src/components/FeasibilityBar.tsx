import React, { useRef } from 'react';

interface FeasibilityBarProps {
  defaultMin: number;
  defaultMax: number;
  feasibleMin: number;
  feasibleMax: number;
  constraintMin: number;
  constraintMax: number;
  baseValue: number;
  selectedValue: number | null;
  onConstraintChange: (min: number, max: number) => void;
}

export function FeasibilityBar({
  defaultMin,
  defaultMax,
  feasibleMin,
  feasibleMax,
  constraintMin,
  constraintMax,
  baseValue,
  selectedValue,
  onConstraintChange,
}: FeasibilityBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  const rangeSpan = defaultMax - defaultMin;
  const getPercent = (val: number) => {
    if (rangeSpan <= 0) return 0;
    return Math.min(100, Math.max(0, ((val - defaultMin) / rangeSpan) * 100));
  };

  const feasibleLeft = getPercent(feasibleMin);
  const feasibleWidth = getPercent(feasibleMax) - feasibleLeft;

  const constraintMinLeft = getPercent(constraintMin);
  const constraintMaxLeft = getPercent(constraintMax);

  const baseLeft = getPercent(baseValue);
  const selectedLeft = selectedValue !== null ? getPercent(selectedValue) : null;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    
    // Lock the active handle based on which constraint is closer to the start coordinates
    const startX = e.clientX - rect.left;
    const startPct = Math.max(0, Math.min(1, startX / rect.width));
    const startVal = Math.round(defaultMin + startPct * (defaultMax - defaultMin));
    
    const distMin = Math.abs(startVal - constraintMin);
    const distMax = Math.abs(startVal - constraintMax);
    const activeHandle = distMin < distMax ? 'min' : 'max';

    const handleDragUpdate = (clientX: number) => {
      const currentRect = barRef.current?.getBoundingClientRect();
      if (!currentRect) return;
      const x = clientX - currentRect.left;
      const pct = Math.max(0, Math.min(1, x / currentRect.width));
      const val = Math.round(defaultMin + pct * (defaultMax - defaultMin));

      if (activeHandle === 'min') {
        onConstraintChange(Math.min(constraintMax, val), constraintMax);
      } else {
        onConstraintChange(constraintMin, Math.max(constraintMin, val));
      }
    };

    handleDragUpdate(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      handleDragUpdate(moveEvent.clientX);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0 || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    
    const startX = e.touches[0].clientX - rect.left;
    const startPct = Math.max(0, Math.min(1, startX / rect.width));
    const startVal = Math.round(defaultMin + startPct * (defaultMax - defaultMin));
    
    const distMin = Math.abs(startVal - constraintMin);
    const distMax = Math.abs(startVal - constraintMax);
    const activeHandle = distMin < distMax ? 'min' : 'max';

    const handleDragUpdate = (clientX: number) => {
      const currentRect = barRef.current?.getBoundingClientRect();
      if (!currentRect) return;
      const x = clientX - currentRect.left;
      const pct = Math.max(0, Math.min(1, x / currentRect.width));
      const val = Math.round(defaultMin + pct * (defaultMax - defaultMin));

      if (activeHandle === 'min') {
        onConstraintChange(Math.min(constraintMax, val), constraintMax);
      } else {
        onConstraintChange(constraintMin, Math.max(constraintMin, val));
      }
    };

    handleDragUpdate(e.touches[0].clientX);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length === 0) return;
      handleDragUpdate(moveEvent.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  let gearedChevronColor = '#6b7280';
  if (selectedValue !== null) {
    if (selectedValue > baseValue) {
      gearedChevronColor = '#059669';
    } else if (selectedValue < baseValue) {
      gearedChevronColor = '#dc2626';
    }
  }

  return (
    <div
      ref={barRef}
      className="feasibility"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      aria-label={`Theoretical range ${defaultMin} to ${defaultMax}`}
      style={{ cursor: 'pointer' }}
    >
      <div className="feasibility-track" />
      <div
        className="feasibility-range"
        style={{ left: `${feasibleLeft}%`, width: `${feasibleWidth}%` }}
      />
      <div
        className="feasibility-chevron-wrapper feasibility-base-wrapper"
        style={{ left: `${baseLeft}%` }}
      >
        <div className="feasibility-base-chevron" />
        <div className="feasibility-tooltip">
          Base {baseValue}
        </div>
      </div>
      {selectedValue !== null && selectedLeft !== null && (
        <div
          className="feasibility-chevron-wrapper feasibility-selected-wrapper"
          style={{ left: `${selectedLeft}%` }}
        >
          <div
            className="feasibility-selected-chevron"
            style={{ borderBottomColor: gearedChevronColor }}
          />
          <div className="feasibility-tooltip">
            Geared {selectedValue} ({selectedValue - baseValue >= 0 ? '+' : ''}{selectedValue - baseValue})
          </div>
        </div>
      )}
      <div
        className="feasibility-constraint-brace feasibility-constraint-min"
        style={{ left: `${constraintMinLeft}%` }}
        title={`Min Constraint: ${constraintMin}`}
      />
      <div
        className="feasibility-constraint-brace feasibility-constraint-max"
        style={{ left: `${constraintMaxLeft}%` }}
        title={`Max Constraint: ${constraintMax}`}
      />
    </div>
  );
}
