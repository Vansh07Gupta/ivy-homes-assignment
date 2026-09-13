import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import { usePagination } from "../hooks/usePagination";
import ProjectCard from "../components/ProjectCard";
import Pagination from "../components/Pagination";
import { titleCase } from "../lib/format";

export default function ProjectsPage() {
  const { projects, loading } = useData();
  const [status, setStatus] = useState("");

  const statuses = useMemo(
    () => [...new Set(projects.map((p) => p.project_status).filter(Boolean))].sort(),
    [projects]
  );

  const filtered = useMemo(
    () => projects.filter((p) => !status || p.project_status === status),
    [projects, status]
  );

  const { page, setPage, totalPages, pageItems, total } = usePagination(filtered, 20);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Projects</h1>

      <div className="mb-4 flex gap-3 rounded border border-gray-200 bg-white p-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border border-gray-300 px-2 py-1.5 text-sm">
          <option value="">Any status</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {titleCase(s)}
            </option>
          ))}
        </select>
      </div>

      {pageItems.length === 0 ? (
        <p className="py-10 text-center text-gray-500">
          {loading && projects.length === 0 ? "Loading projects…" : "No projects match this filter."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((project) => (
            <ProjectCard key={project.project_id} project={project} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} total={total} />
    </div>
  );
}
