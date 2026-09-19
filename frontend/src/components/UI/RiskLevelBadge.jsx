import React from 'react';

export default function RiskLevelBadge({ level, score, showScore }) {
  let badgeClass = 'chip-green';
  let icon = '🟢';
  let isPulsing = false;

  const l = (level || '').toUpperCase();
  if (l === 'CRITICAL') {
    badgeClass = 'chip-red';
    icon = '🔴';
    isPulsing = true;
  } else if (l === 'VERY HIGH') {
    badgeClass = 'chip-red';
    icon = '🔴';
  } else if (l === 'HIGH') {
    badgeClass = 'chip-orange';
    icon = '🟠';
  } else if (l === 'MODERATE') {
    badgeClass = 'chip-amber';
    icon = '🟡';
  }

  return (
    <span 
      className={`chip ${badgeClass}`} 
      style={isPulsing ? { animation: 'pulse-red 2s infinite' } : {}}
    >
      {icon} {l}
      {showScore && score !== undefined && ` (${score})`}
    </span>
  );
}
