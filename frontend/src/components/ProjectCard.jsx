import { Link } from "react-router-dom";
import { formatCrores, titleCase } from "../lib/format";

export default function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.project_id}`}
      className="flex flex-col rounded border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300"
    >
      <span className="font-medium text-gray-900">{project.apartment_name}</span>
      <span className="text-sm text-gray-500">
        {project.developer_name} · {titleCase(project.locality)}
      </span>
      <span className="mt-2 text-sm text-gray-700">
        {formatCrores(project.price_min)} – {formatCrores(project.price_max)}
      </span>
      <span className="text-xs text-gray-400 mt-1">
        {titleCase(project.project_status)} · {project.total_listings} listings
      </span>
    </Link>
  );
}
