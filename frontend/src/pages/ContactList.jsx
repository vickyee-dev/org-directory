import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, Plus, Search, Users } from "lucide-react";
import { contactsApi, organizationsApi } from "../api";
import { useQuery } from "../hooks/useQuery";
import { useDebounce } from "../hooks/useDebounce";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import ContactsTable from "../components/ContactsTable";
import { Button, buttonClass, Card, DataBoundary, EmptyState, FilterSelect, inputClass, PageHeader, Pagination } from "../components/ui";

const SORTS = {
  "createdAt:desc": "Newest first",
  "firstName:asc": "First name A–Z",
  "lastName:asc": "Last name A–Z",
  "lastName:desc": "Last name Z–A",
};

export default function ContactList() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const organizationId = params.get("organizationId") || "";
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

  const [searchInput, setSearchInput] = useState(search);
  const debounced = useDebounce(searchInput);
  useEffect(() => {
    if (debounced !== search) update({ search: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const [sortBy, order] = sort.split(":");
  const filters = { search, organizationId, status, sortBy, order };

  const orgs = useQuery(() => organizationsApi.options(), []);
  const query = useQuery(() => contactsApi.list({ ...filters, page, limit: 10 }), [search, organizationId, status, sort, page]);

  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const toggle = async (c) => {
    try {
      await contactsApi.toggle(c.id);
      toast.success(`${c.firstName} ${c.lastName} ${c.isActive ? "deactivated" : "activated"}`);
      query.reload();
    } catch (e) { toast.error(e.message); }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await contactsApi.remove(toDelete.id);
      toast.success("Contact deleted");
      setToDelete(null);
      query.reload();
    } catch (e) { toast.error(e.message); }
    setBusy(false);
  };

  const exportCsv = async () => {
    setExporting(true);
    try { await contactsApi.exportCsv(filters); } catch (e) { toast.error(e.message); }
    setExporting(false);
  };

  const rows = query.data?.data ?? [];
  const hasFilters = search || organizationId || status;

  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle="Everyone across all organizations."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} loading={exporting}><Download className="size-4" /> Export CSV</Button>
            <Link to="/contacts/new" className={buttonClass()}><Plus className="size-4" /> Add contact</Link>
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
              placeholder="Search name, email, title or organization…"
              className={`${inputClass(false)} pl-9`}
              aria-label="Search contacts"
            />
          </div>
          <FilterSelect label="Organization" value={organizationId} onChange={(e) => update({ organizationId: e.target.value })}>
            <option value="">All organizations</option>
            {(orgs.data ?? []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </FilterSelect>
          <FilterSelect label="Status" value={status} onChange={(e) => update({ status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </FilterSelect>
          <FilterSelect label="Sort" value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {Object.entries(SORTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </FilterSelect>
        </div>

        <DataBoundary
          query={query}
          isEmpty={rows.length === 0}
          empty={
            <EmptyState
              icon={Users}
              title={hasFilters ? "No contacts match your filters" : "No contacts yet"}
              description={hasFilters ? "Try changing or clearing the filters." : "Add a contact to an organization to get started."}
              action={hasFilters ? (
                <Button variant="secondary" onClick={() => { setSearchInput(""); setParams({}, { replace: true }); }}>Clear filters</Button>
              ) : (
                <Link to="/contacts/new" className={buttonClass()}>Add contact</Link>
              )}
            />
          }
        >
          <ContactsTable contacts={rows} showOrganization onToggle={toggle} onDelete={setToDelete} />
          <Pagination meta={query.data?.meta} onPage={(p) => update({ page: p > 1 ? String(p) : "" })} />
        </DataBoundary>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete contact?"
        message={toDelete && `${toDelete.firstName} ${toDelete.lastName} will be permanently deleted. To keep the record, deactivate it instead.`}
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
