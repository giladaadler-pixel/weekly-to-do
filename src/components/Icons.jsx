// Line icons in the app's style. They take the text color, and are hidden from screen
// readers: every button that uses one also has a text label or aria-label.

const PATHS = {
  today: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  week: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </>
  ),
  gym: <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />,
  accomplishments: (
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8.5 21h7" />
  ),
  notes: <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5" />,
  reminder: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />,
  badge: (
    <>
      <rect x="3" y="5" width="14" height="14" rx="3" />
      <circle cx="18" cy="6" r="3" />
    </>
  ),
  export: <path d="M12 4v11M7 10l5 5 5-5M4 20h16" />,
  import: <path d="M12 15V4M7 9l5-5 5 5M4 20h16" />,
  prev: <path d="M15 6l-6 6 6 6" />,
  next: <path d="M9 6l6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  "calendar-plus": (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4M12 12.5v5M9.5 15h5" />
    </>
  ),
};

export default function Icon({ name, size = 18 }) {
  return (
    <svg
      className="icon"
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}
