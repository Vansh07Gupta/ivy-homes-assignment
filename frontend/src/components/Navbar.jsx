import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/listings", label: "Listings" },
  { to: "/rentals", label: "Rentals" },
  { to: "/projects", label: "Projects" },
  { to: "/favourites", label: "Saved" },
  { to: "/insights", label: "Insights" },
];

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold text-gray-900">Ivy Homes</span>
          <nav className="flex gap-4 text-sm">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded px-2 py-1 ${isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{user?.email}</span>
          <button onClick={logout} className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
