import React from 'react';

function ProgressBar({ pct }) {
  return (
    <div className="prog-outer">
      <div className="prog-inner" id="progBar" style={{width:`${pct}%`}} />
    </div>
  );
}

export default ProgressBar;
