import { Link, useLocation, useNavigate } from "react-router-dom";

export default function BackLink({ fallback, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.key === "default") {
    return (
      <Link to={fallback} className="mb-4 inline-block text-sm text-gray-500 hover:underline">
        {children}
      </Link>
    );
  }

  return (
    <button onClick={() => navigate(-1)} className="mb-4 inline-block text-sm text-gray-500 hover:underline">
      {children}
    </button>
  );
}
