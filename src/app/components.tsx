import { useEffect, useLayoutEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useStore } from "./store";

export type IconName =
  | "home"
  | "trophy"
  | "chart"
  | "users"
  | "user"
  | "bell"
  | "plus"
  | "flame"
  | "arrow"
  | "clock"
  | "bolt"
  | "shield"
  | "target"
  | "lock"
  | "check"
  | "chevron"
  | "search"
  | "share"
  | "settings"
  | "medal"
  | "heart"
  | "message"
  | "calendar"
  | "wallet"
  | "x"
  | "edit"
  | "trash"
  | "back"
  | "pause"
  | "play"
  | "filter"
  | "download";
const paths: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4M12 13v4m-4 3h8" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
    </>
  ),
  users: (
    <>
      <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  flame: (
    <path d="M13 22c4.4-.8 7-4.1 7-8.2 0-2.2-1-5.1-3.8-7.8.1 2-1.1 3.5-2.1 4.3.3-3.4-1.8-6.4-5-8.3.2 3.7-2.1 5.6-3.4 7.7C2.7 14.5 5.4 20.9 11 22c-2.1-1.2-2.5-4.2-.7-6.2.2 1.4 1 2.1 1.7 2.7.8-1.2 1.1-2.5.9-3.9 2.4 1.9 2.8 5.5.1 7.4Z" />
  ),
  arrow: (
    <>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  bolt: <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />,
  shield: <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="m8 11 8-5m-8 7 8 5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6A8 8 0 0 0 9 7L6.5 6 4.5 9.5l2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A8 8 0 0 0 10.4 18l.3 2.6h4L15 18a8 8 0 0 0 1.5-1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="14" r="6" />
      <path d="m8 9-3-7h5l2 5 2-5h5l-3 7" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
  ),
  message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13v3" />
      <path d="M15 12h5v4h-5a2 2 0 0 1 0-4Z" />
    </>
  ),
  x: <path d="m6 6 12 12M18 6 6 18" />,
  edit: (
    <>
      <path d="m14 4 6 6M4 20l4-1 11-11a2 2 0 0 0-3-3L5 16l-1 4Z" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6" />
    </>
  ),
  back: (
    <>
      <path d="m15 18-6-6 6-6" />
    </>
  ),
  pause: (
    <>
      <path d="M9 5v14M15 5v14" />
    </>
  ),
  play: <path d="m8 5 11 7-11 7V5Z" />,
  filter: (
    <>
      <path d="M4 6h16M7 12h10m-7 6h4" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M5 21h14" />
    </>
  ),
};
export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}
export function Avatar({
  initials,
  color = "green",
  size = "md",
  online = false,
  src,
}: {
  initials: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
  src?: string;
}) {
  return (
    <span className={`avatar avatar-${color} avatar-${size}`} aria-label={`${initials} avatar`}>
      {src ? <img src={src} alt="" /> : initials}
      {online && <i />}
    </span>
  );
}
export function Progress({ value }: { value: number }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
export function showToast(message: string, type: "success" | "error" = "success") {
  window.dispatchEvent(new CustomEvent("stashup-toast", { detail: { message, type } }));
}
export function Header({
  title,
  subtitle,
  back = false,
  action,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  action?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { state } = useStore();
  const unread = state.notifications.filter((n) => !n.read).length;
  return (
    <header className="topbar">
      <div className="brand-row">
        <div className="header-title-wrap">
          {back && (
            <button className="back-button" onClick={() => navigate(-1)} aria-label="Go back">
              <Icon name="back" />
            </button>
          )}
          {title ? (
            <div>
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="muted small">{subtitle}</p>}
            </div>
          ) : (
            <Link to="/" className="logo">
              <img
                className="logo-mark-image"
                src={state.settings.theme === "dark" ? "/favicon-dark.png" : "/favicon.png"}
                alt=""
              />
              <span>stash</span>
            </Link>
          )}
        </div>
        <div className="header-actions">
          {action}
          <Link
            to="/notifications"
            className="icon-button notification"
            aria-label={`${unread} unread notifications`}
          >
            <Icon name="bell" />
            {unread > 0 && <i />}
          </Link>
        </div>
      </div>
    </header>
  );
}
export function Empty({
  icon = "target",
  title,
  text,
  action,
}: {
  icon?: IconName;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span>
        <Icon name={icon} size={34} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function ConfirmDialog({
  title,
  text,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: {
  title: string;
  text: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal confirm-modal"
        role="alertdialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="modal-icon danger">
          <Icon name="trash" />
        </span>
        <h2>{title}</h2>
        <p className="muted">{text}</p>
        <div className="dialog-actions">
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="danger-button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const nav = [
  ["/", "Home", "home"],
  ["/challenges", "Challenges", "trophy"],
  ["/leaderboard", "Rank", "chart"],
  ["/friends", "Friends", "users"],
  ["/profile", "Profile", "user"],
] as const;
export function RootLayout() {
  const { state } = useStore();
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const location = useLocation();
  useEffect(() => {
    const listener = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setToast(detail);
      setTimeout(() => setToast(null), 3000);
    };
    window.addEventListener("stashup-toast", listener);
    return () => window.removeEventListener("stashup-toast", listener);
  }, []);
  useLayoutEffect(() => {
    const theme = state.settings.theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#f5f8f6" : "#070d0c");
    const icon = theme === "dark" ? "/favicon-dark.png" : "/favicon.png";
    document
      .querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="apple-touch-icon"]')
      .forEach((link) => link.setAttribute("href", icon));
  }, [state.settings.theme]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: state.settings.reducedMotion ? "auto" : "smooth" });
  }, [location.pathname, state.settings.reducedMotion]);
  return (
    <div className={`app-shell ${state.settings.reducedMotion ? "reduce-motion" : ""}`}>
      <div className="app-view">
        <Outlet />
      </div>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {nav.map(([to, label, icon]) => (
          <NavLink
            end={to === "/"}
            to={to}
            key={to}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Icon name={icon} />
            <span>{label}</span>
            {to === "/friends" && state.people.some((p) => p.status === "incoming") && <i />}
          </NavLink>
        ))}
      </nav>
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          <Icon name={toast.type === "error" ? "x" : "check"} />
          {toast.message}
        </div>
      )}
    </div>
  );
}
