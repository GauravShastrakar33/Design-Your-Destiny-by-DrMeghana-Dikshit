type HeartChakraIconProps = {
  className?: string;
};

export default function HeartChakraIcon({
  className = "w-12 h-12",
}: HeartChakraIconProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none">
      {/* 12 Symmetrically Rotated Lotus Petals */}
      <g
        stroke="#5FB77D"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g transform="rotate(0 100 100)">
          <path d="M 100 20 Q 92 24 88 34 Q 94 29 100 32 Q 106 29 112 34 Q 108 24 100 20" />
        </g>
        <g transform="rotate(30 100 100)">
          <path d="M 100 20 Q 92 24 88 34 Q 94 29 100 32 Q 106 29 112 34 Q 108 24 100 20" />
        </g>
        <g transform="rotate(60 100 100)">
          <path d="M 100 20 Q 92 24 88 34 Q 94 29 100 32 Q 106 29 112 34 Q 108 24 100 20" />
        </g>
        <g transform="rotate(90 100 100)">
          <path d="M 100 20 Q 92 24 88 34 Q 94 29 100 32 Q 106 29 112 34 Q 108 24 100 20" />
        </g>
        <g transform="rotate(120 100 100)">
          <path d="M 100 20 Q 92 24 88 34 Q 94 29 100 32 Q 106 29 112 34 Q 108 24 100 20" />
        </g>
        <g transform="rotate(150 100 100)">
          <path d="M 100 20 Q 92 24 88 34 Q 94 29 100 32 Q 106 29 112 34 Q 108 24 100 20" />
        </g>
        <g transform="rotate(180 100 100)">
          <path d="M 100 20 Q 92 24 88 34 Q 94 29 100 32 Q 106 29 112 34 Q 108 24 100 20" />
        </g>
        <g transform="rotate(210 100 100)">
          <path d="M 100 20 Q 92 24 88 34 Q 94 29 100 32 Q 106 29 112 34 Q 108 24 100 20" />
        </g>
        <g transform="rotate(240 100 100)">
          <path d="M 100 20 Q 92 24 88 34 Q 94 29 100 32 Q 106 29 112 34 Q 108 24 100 20" />
        </g>
        <g transform="rotate(270 100 100)">
          <path d="M 100 20 Q 92 24 88 34 Q 94 29 100 32 Q 106 29 112 34 Q 108 24 100 20" />
        </g>
        <g transform="rotate(300 100 100)">
          <path d="M 100 20 Q 92 24 88 34 Q 94 29 100 32 Q 106 29 112 34 Q 108 24 100 20" />
        </g>
        <g transform="rotate(330 100 100)">
          <path d="M 100 20 Q 92 24 88 34 Q 94 29 100 32 Q 106 29 112 34 Q 108 24 100 20" />
        </g>
      </g>

      {/* Central Circle */}
      <circle
        cx="100"
        cy="100"
        r="45"
        stroke="#5FB77D"
        strokeWidth="3.5"
        fill="none"
      />

      {/* Star of David - Two Overlapping Triangles */}
      <g
        stroke="#5FB77D"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 100 70 L 125 120 L 75 120 Z" />
        <path d="M 100 130 L 75 80 L 125 80 Z" />
      </g>
    </svg>
  );
}
