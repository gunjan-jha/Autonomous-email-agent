import React from 'react';

export default function SkeletonLoader({ rows = 6 }) {
  return (
    <div className="email-rows-container">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="skeleton-box" style={{ width: '110px', height: '14px' }} />
            <div className="skeleton-box" style={{ width: '40px', height: '12px' }} />
          </div>
          <div className="skeleton-box" style={{ width: '220px', height: '13px' }} />
          <div style={{ display: 'flex', gap: '4px' }}>
            <div className="skeleton-box" style={{ width: '50px', height: '12px' }} />
            <div className="skeleton-box" style={{ width: '40px', height: '12px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
