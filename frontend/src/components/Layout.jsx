import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Building2, LayoutDashboard, Menu, Tags, Users, X } from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/industries", label: "Industries", icon: Tags },
];

const titles = [
  [/^\/$/, "Dashboard"],
  [/^\/organizations\/new/, "New organization"],
  [/^\/organizations\/\d+\/edit/, "Edit organization"],
  [/^\/organizations\/\d+\/contacts\/new/, "New contact"],
  [/^\/organizations\/\d+/, "Organization"],
  [/^\/organizations/, "Organizations"],
  [/^\/contacts\/new/, "New contact"],
  [/^\/contacts\/\d+\/edit/, "Edit contact"],
  [/^\/contacts/, "Contacts"],
  [/^\/industries/, "Industries"],
];

const titleFor = (path) => titles.find(([re]) => re.test(path))?.[1] ?? "Not found";

function SidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Building2 className="size-5" />
        </span>
        <span className="text-lg font-semibold text-white">Org Directory</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-slate-800 text-white" : "hover:bg-slate-800/60 hover:text-white"
              }`
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-4 text-xs text-slate-500">
        Organization Contact Directory
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const title = titleFor(pathname);

  useEffect(() => {
    setOpen(false);
    document.title = `${title} · Org Directory`;
  }, [pathname, title]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64">
            <SidebarContent onNavigate={() => setOpen(false)} />
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 text-slate-400 hover:text-white"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
