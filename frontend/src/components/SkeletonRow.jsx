export default function SkeletonRow({ width = '100%' }) {
  return (
    <div
      style={{
        height: '2.75rem',
        background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.2s infinite',
        borderRadius: '6px',
        marginBottom: '0.5rem',
        opacity: 0.6
      }}
    />
  );
}
