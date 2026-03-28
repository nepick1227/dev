import { C } from "@/styles/theme";

type Props = {
  name: string;
  address: string;
  size?: number;
};

export default function ShareBtn({ name, address, size = 12 }: Props) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        window.open(
          `https://map.kakao.com/link/search/${encodeURIComponent(name + " " + address)}`,
          "_blank"
        );
      }}
      style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="18" cy="5" r="3" stroke={C.textSecondary} strokeWidth="1.8" />
        <circle cx="6" cy="12" r="3" stroke={C.textSecondary} strokeWidth="1.8" />
        <circle cx="18" cy="19" r="3" stroke={C.textSecondary} strokeWidth="1.8" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={C.textSecondary} strokeWidth="1.8" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={C.textSecondary} strokeWidth="1.8" />
      </svg>
    </button>
  );
}
