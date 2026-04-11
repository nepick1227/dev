interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export function HomeIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 5V19M5 12H19" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function BookmarkIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 5C5 3.9 5.9 3 7 3H17C18.1 3 19 3.9 19 5V21L12 17.5L5 21V5Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function UserIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <path d="M4 20C4 17 7.6 15 12 15C16.4 15 20 17 20 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6L18 18M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CameraIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M23 19C23 19.5 22.8 20 22.4 20.4C22 20.8 21.5 21 21 21H3C2.5 21 2 20.8 1.6 20.4C1.2 20 1 19.5 1 19V8C1 7.5 1.2 7 1.6 6.6C2 6.2 2.5 6 3 6H7L9 3H15L17 6H21C21.5 6 22 6.2 22.4 6.6C22.8 7 23 7.5 23 8V19Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function MapPinIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 21C12 21 4 14 4 9C4 6.8 4.8 4.8 6.3 3.3C7.8 1.8 9.8 1 12 1C14.2 1 16.2 1.8 17.7 3.3C19.2 4.8 20 6.8 20 9C20 14 12 21 12 21Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="3" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function EditIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M11 4H4C3.5 4 3 4.2 2.6 4.6C2.2 5 2 5.5 2 6V20C2 20.5 2.2 21 2.6 21.4C3 21.8 3.5 22 4 22H18C18.5 22 19 21.8 19.4 21.4C19.8 21 20 20.5 20 20V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5C18.9 2.1 19.4 1.9 20 1.9C20.6 1.9 21.1 2.1 21.5 2.5C21.9 2.9 22.1 3.4 22.1 4C22.1 4.6 21.9 5.1 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StarIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2L15.1 8.3L22 9.3L17 14.1L18.2 21L12 17.8L5.8 21L7 14.1L2 9.3L8.9 8.3L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CopyIcon({ size = 12, color = "#9CA3AF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="9" height="9" rx="2" stroke={color} strokeWidth="1.3" />
      <path d="M11 5V3a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2h2" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}

export function KakaoMapShareIcon({ size = 12, color = "#9CA3AF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="18" cy="5" r="3" stroke={color} strokeWidth="1.8" />
      <circle cx="6" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <circle cx="18" cy="19" r="3" stroke={color} strokeWidth="1.8" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={color} strokeWidth="1.8" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function NepickLogo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D32F2F" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#D32F2F" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path
        d="M40 74C40 74 64 50 64 30C64 16.75 53.25 6 40 6C26.75 6 16 16.75 16 30C16 50 40 74 40 74Z"
        fill="#D32F2F"
      />
      <path
        d="M25 38h30v3c0 7-5.5 11-15 11S25 48 25 41v-3z"
        fill="url(#logo-grad)"
        stroke="#DF6767"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <text
        x="40"
        y="31"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="24"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="white"
      >
        N
      </text>
    </svg>
  );
}
