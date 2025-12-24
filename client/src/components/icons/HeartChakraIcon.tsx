type HeartChakraIconProps = {
  className?: string;
};

export default function HeartChakraIcon({
  className = "w-12 h-12",
}: HeartChakraIconProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 200 200" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
    >
      {/* 12 Lotus Petals */}
      <g
        stroke="#5FB77D"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {[...Array(12)].map((_, i) => (
          <g key={i} transform={`rotate(${i * 30} 100 100)`}>
            <path 
              d="M 100 18 Q 92 24 88 36 Q 94 30 100 34 Q 106 30 112 36 Q 108 24 100 18" 
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </g>

      {/* Expanded Central Circle (touches petals) */}
      <circle
        cx="100"
        cy="100"
        r="58"
        stroke="#5FB77D"
        strokeWidth="3.5"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />

      {/* Star of David — Slightly Larger, Still Balanced */}
      <g
        stroke="#5FB77D"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {/* Upward triangle */}
        <path 
          d="M 100 52 L 140 124 L 60 124 Z" 
          vectorEffect="non-scaling-stroke"
        />

        {/* Downward triangle */}
        <path 
          d="M 100 148 L 60 76 L 140 76 Z" 
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </svg>
  );
}
