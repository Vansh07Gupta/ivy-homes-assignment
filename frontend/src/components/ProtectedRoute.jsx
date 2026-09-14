import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DataProvider, useData } from "../context/DataContext";
import { SavedProvider } from "../context/SavedContext";
import Navbar from "./Navbar";

function Shell() {
  const { loading, error, loadedAt, reload } = useData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {loading && !loadedAt && (
        <div className="border-b border-gray-200 bg-blue-50 px-4 py-2 text-center text-sm text-blue-700">
          Loading listings, rentals and projects for your city…
        </div>
      )}
      {error && (
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="flex items-center justify-between rounded border border-red-200 bg-red-50 p-4 text-red-700">
            <span>Failed to load data: {error}</span>
            <button onClick={reload} className="rounded border border-red-300 px-3 py-1 text-sm">
              Retry
            </button>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  return (
    <DataProvider>
      <SavedProvider>
        <Shell />
      </SavedProvider>
    </DataProvider>
  );
}
