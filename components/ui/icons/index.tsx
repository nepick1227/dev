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

// ── 소셜 로그인 아이콘 ────────────────────────────────

export function KakaoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-label="카카오">
      <rect width="20" height="20" rx="6" fill="#FEE500" />
      <path
        d="M10 4.5C7.0 4.5 4.5 6.4 4.5 8.7C4.5 10.2 5.5 11.5 7.0 12.3L6.4 14.5C6.4 14.6 6.5 14.7 6.6 14.6L9.1 13.0C9.4 13.0 9.7 13.1 10 13.1C13.0 13.1 15.5 11.1 15.5 8.7C15.5 6.4 13.0 4.5 10 4.5Z"
        fill="#191919"
      />
    </svg>
  );
}

export function NaverIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-label="네이버">
      <rect width="20" height="20" rx="10" fill="#03C75A" />
      <path d="M11.2 10.4L8.6 6H6V14H8.8V9.6L11.4 14H14V6H11.2V10.4Z" fill="white" />
    </svg>
  );
}

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-label="구글">
      <rect width="20" height="20" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="1" />
      <path d="M16.5 10.2C16.5 9.7 16.5 9.2 16.4 8.7H10V11.5H13.6C13.5 12.3 13.0 13.0 12.3 13.5V15.2H14.5C15.8 14.0 16.5 12.3 16.5 10.2Z" fill="#4285F4" />
      <path d="M10 16.8C11.8 16.8 13.3 16.2 14.5 15.2L12.3 13.5C11.7 13.9 10.9 14.2 10 14.2C8.3 14.2 6.8 13.0 6.3 11.5H4.0V13.2C5.2 15.6 7.4 16.8 10 16.8Z" fill="#34A853" />
      <path d="M6.3 11.5C6.1 10.9 6.0 10.3 6.0 9.7C6.0 9.1 6.1 8.5 6.3 7.9V6.2H4.0C3.4 7.4 3.0 8.5 3.0 9.7C3.0 10.9 3.4 12.0 4.0 13.2L6.3 11.5Z" fill="#FBBC04" />
      <path d="M10 5.2C11.0 5.2 11.9 5.5 12.7 6.2L14.5 4.4C13.3 3.3 11.8 2.6 10 2.6C7.4 2.6 5.2 3.9 4.0 6.2L6.3 7.9C6.8 6.4 8.3 5.2 10 5.2Z" fill="#EA4335" />
    </svg>
  );
}

export function TrashIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 6H5H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6V20C19 20.5 18.8 21 18.4 21.4C18 21.8 17.5 22 17 22H7C6.5 22 6 21.8 5.6 21.4C5.2 21 5 20.5 5 20V6M8 6V4C8 3.5 8.2 3 8.6 2.6C9 2.2 9.5 2 10 2H14C14.5 2 15 2.2 15.4 2.6C15.8 3 16 3.5 16 4V6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BellIcon({ size = 24, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M18 8C18 6.4 17.4 4.9 16.2 3.8C15 2.6 13.6 2 12 2C10.4 2 8.9 2.6 7.8 3.8C6.6 4.9 6 6.4 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.7 21C13.5 21.3 13.3 21.6 13 21.8C12.7 22 12.4 22 12 22C11.7 22 11.3 22 11 21.8C10.7 21.6 10.5 21.3 10.3 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

export function CopyIcon({ size = 12, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="9" height="9" rx="2" stroke={color} strokeWidth="1.3" />
      <path d="M11 5V3a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2h2" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}


export function ShareIcon({ size = 12, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 6 12 2 8 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="2" x2="12" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function NepickLogo({ size = 80 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/nepick-logo.svg" alt="네픽 로고" width={size} height={size} style={{ objectFit: "contain" }} />;
}

export function CafeIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 10H15C16.1046 10 17 10.8954 17 12V13C17 15.7614 14.7614 18 12 18H10C7.23858 18 5 15.7614 5 13V12C5 10.8954 5.89543 10 7 10Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 11H18C19.6569 11 21 12.3431 21 14C21 15.6569 19.6569 17 18 17H17" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 20H18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 4V7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 4V7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function RestaurantIcon({ size = 20, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 3V10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 3V10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 3V10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 10V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 3C14.8954 3 14 3.89543 14 5V9C14 10.1046 14.8954 11 16 11H18V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
