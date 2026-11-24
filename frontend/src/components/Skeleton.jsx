import React from 'react';

export default function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', style = {} }) {
  return (
    <div
      className="skeleton-box"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="saas-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="45%" height="16px" />
        <Skeleton width="28px" height="28px" borderRadius="50%" />
      </div>
      <Skeleton width="60%" height="32px" />
      <Skeleton width="75%" height="14px" />
    </div>
  );
}
