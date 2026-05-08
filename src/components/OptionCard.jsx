import React from 'react';

function OptionCard({ option, label, subLabel, selected, checkbox, onSelect }) {
  return (
    <div className={`opt${checkbox ? ' chk' : ''}${selected ? ' sel' : ''}`} onClick={onSelect}>
      <div className="opt-dot"></div>
      <span className="opt-label">
        {label}
        {subLabel ? <span className="opt-sub">{subLabel}</span> : null}
      </span>
    </div>
  );
}

export default OptionCard;
