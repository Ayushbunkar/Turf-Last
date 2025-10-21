import React from 'react';
import { formatHourLabel } from './helpers';

export default function HourSlot({ hour, status, disabled, onClick, className: extraClass = '' }) {
  // status: 'available' | 'booked' | 'unavailable'
  const className = `hour-slot ${status} ${disabled ? 'disabled' : ''} ${extraClass}`.trim();
  return (
    <button
      type="button"
      className={className}
      aria-pressed={status === 'booked'}
      aria-disabled={disabled || status !== 'available'}
      onClick={() => !disabled && status === 'available' && onClick(hour)}
    >
      <div className="hour-label">{formatHourLabel(hour)}</div>
      <div className="hour-state">{status === 'available' ? 'Available' : status === 'booked' ? 'Booked' : 'Unavailable'}</div>
    </button>
  );
}

