import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DataProvider, useData } from "../context/DataContext";
import { SavedProvider } from "../context/SavedContext";
import Navbar from "./Navbar";

function Shell() {
  const { loading, error, loadedAt, reload } = useData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {loading && !loadedAt && (
          <div className="rounded border border-gray-200 bg-white p-6 text-center text-gray-500">
            Loading listings, rentals and projects for your city…
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center justify-between rounded border border-red-200 bg-red-50 p-4 text-red-700">
            <span>Failed to load data: {error}</span>
            <button onClick={reload} className="rounded border border-red-300 px-3 py-1 text-sm">
              Retry
            </button>
          </div>
        )}
        {(loadedAt || !loading) && <Outlet />}
      </main>
    </div>
  );
}

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <DataProvider>
      <SavedProvider>
        <Shell />
      </SavedProvider>
    </DataProvider>
  );
}
