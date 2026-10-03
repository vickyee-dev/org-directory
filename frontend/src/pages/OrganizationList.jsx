import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Building2, Download, Eye, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { industriesApi, organizationsApi } from "../api";
import { useQuery } from "../hooks/useQuery";
import { useDebounce } from "../hooks/useDebounce";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  Avatar, Button, buttonClass, Card, DataBoundary, EmptyState, FilterSelect,
  IconButton, inputClass, PageHeader, Pagination, StatusBadge,
} from "../components/ui";

const SORTS = {
  "createdAt:desc": "Newest first",
  "createdAt:asc": "Oldest first",
  "name:asc": "Name A–Z",
  "name:desc": "Name Z–A",
  "foundedDate:asc": "Oldest founded",
  "foundedDate:desc": "Recently founded",
};

export default function OrganizationList() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const industryId = params.get("industryId") || "";
  const status = params.get("status") || "";
  const sort = SORTS[params.get("sort")] ? params.get("sort") : "createdAt:desc";
  const page = Number(params.get("page")) || 1;

  const update = (changes) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(changes)) v ? next.set(k, v) : next.delete(k);
        if (!("page" in changes)) next.delete("page");
        return next;
      },
      { replace: true }
    );

  // Debounced search box -> URL
  const [searchInput, setSearchInput] = useState(search);
  const debounced = useDebounce(searchInput);
  useEffect(() => {
    if (debounced !== search) update({ search: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const [sortBy, order] = sort.split(":");
  const filters = { search, industryId, status, sortBy, order };

  const industries = useQuery(() => industriesApi.list(), []);
  const query = useQuery(
    () => organizationsApi.list({ ...filters, page, limit: 10 }),
    [search, industryId, status, sort, page]
  );

  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const toggle = async (org) => {
    try {
      await organizationsApi.toggle(org.id);
      toast.success(`${org.name} ${org.isActive ? "deactivated" : "activated"}`);
      query.reload();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await organizationsApi.remove(toDelete.id);
      toast.success(`${toDelete.name} deleted`);
      setToDelete(null);
      query.reload();
    } catch (e) {
      toast.error(e.message);
    }
    setBusy(false);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      await organizationsApi.exportCsv(filters);
    } catch (e) {
      toast.error(e.message);
    }
    setExporting(false);
  };

  const rows = query.data?.data ?? [];
  const hasFilters = search || industryId || status;

  return (
    <>
      <PageHeader
        title="Organizations"
        subtitle="Browse, filter and manage every organization in the directory."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} loading={exporting}>
              <Download className="size-4" /> Export CSV
            </Button>
            <Link to="/organizations/new" className={buttonClass()}>
              <Plus className="size-4" /> Add organization
            </Link>
          </>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, website or tax ID…"
              className={`${inputClass(false)} pl-9`}
              aria-label="Search organizations"
            />
          </div>
          <FilterSelect label="Industry" value={industryId} onChange={(e) => update({ industryId: e.target.value })}>
            <option value="">All industries</option>
            {(industries.data ?? []).map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Status" value={status} onChange={(e) => update({ status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </FilterSelect>
          <FilterSelect label="Sort" value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {Object.entries(SORTS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </FilterSelect>
        </div>

        <DataBoundary
          query={query}
          isEmpty={rows.length === 0}
          empty={
            <EmptyState
              icon={Building2}
              title={hasFilters ? "No organizations match your filters" : "No organizations yet"}
              description={hasFilters ? "Try changing or clearing the filters." : "Add your first organization to get started."}
              action={
                hasFilters ? (
                  <Button variant="secondary" onClick={() => { setSearchInput(""); setParams({}, { replace: true }); }}>
                    Clear filters
                  </Button>
                ) : (
                  <Link to="/organizations/new" className={buttonClass()}>Add organization</Link>
                )
              }
            />
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Industry</th>
                  <th className="px-4 py-3 font-medium">Tax ID</th>
                  <th className="px-4 py-3 font-medium">Contacts</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <Link to={`/organizations/${org.id}`} className="flex items-center gap-3">
                        <Avatar name={org.name} />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 hover:text-indigo-600">{org.name}</p>
                          {org.website && (
                            <p className="max-w-60 truncate text-xs text-slate-500">
                              {org.website.replace(/^https?:\/\//, "")}
                            </p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{org.industry?.name || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{org.taxId || "—"}</td>
                    <td className="px-4 py-3">
                      <Link to={`/organizations/${org.id}`} className="text-indigo-600 hover:underline">
                        {org._count.contacts}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><StatusBadge active={org.isActive} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton label="View" to={`/organizations/${org.id}`}><Eye className="size-4" /></IconButton>
                        <IconButton label="Edit" to={`/organizations/${org.id}/edit`}><Pencil className="size-4" /></IconButton>
                        <IconButton label={org.isActive ? "Deactivate" : "Activate"} onClick={() => toggle(org)}>
                          <Power className="size-4" />
                        </IconButton>
                        <IconButton label="Delete" tone="danger" onClick={() => setToDelete(org)}>
                          <Trash2 className="size-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={query.data?.meta} onPage={(p) => update({ page: p > 1 ? String(p) : "" })} />
        </DataBoundary>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete organization?"
        message={
          toDelete &&
          `“${toDelete.name}” and its ${toDelete._count.contacts} contact(s) will be permanently deleted. To keep the records, deactivate it instead.`
        }
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
