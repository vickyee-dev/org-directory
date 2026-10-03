import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Calendar, Download, Globe, Hash, Pencil, Plus, Power, Tags, Trash2, Users } from "lucide-react";
import { contactsApi, organizationsApi } from "../api";
import { useQuery } from "../hooks/useQuery";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import ContactsTable from "../components/ContactsTable";
import { Avatar, Button, buttonClass, Card, DataBoundary, EmptyState, ErrorState, Spinner, StatusBadge } from "../components/ui";
import { formatDate } from "../lib/format";

function Detail({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <div className="text-sm text-slate-900">{children || "—"}</div>
      </div>
    </div>
  );
}

export default function OrganizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const org = useQuery(() => organizationsApi.get(id), [id]);
  const contacts = useQuery(() => organizationsApi.contacts(id), [id]);

  const [showInactive, setShowInactive] = useState(true);
  const [confirm, setConfirm] = useState(null); // { type: "org" | "contact", item }
  const [busy, setBusy] = useState(false);

  if (org.loading && !org.data) return <Spinner />;
  if (org.error) {
    return org.error.status === 404 ? <Navigate to="/404" replace /> : <ErrorState error={org.error} onRetry={org.reload} />;
  }
  const o = org.data;

  const refresh = () => { org.reload(); contacts.reload(); };

  const toggleOrg = async () => {
    try { await organizationsApi.toggle(o.id); toast.success(`${o.name} ${o.isActive ? "deactivated" : "activated"}`); org.reload(); }
    catch (e) { toast.error(e.message); }
  };

  const toggleContact = async (c) => {
    try { await contactsApi.toggle(c.id); toast.success(`Contact ${c.isActive ? "deactivated" : "activated"}`); contacts.reload(); }
    catch (e) { toast.error(e.message); }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      if (confirm.type === "org") {
        await organizationsApi.remove(o.id);
        toast.success(`${o.name} deleted`);
        navigate("/organizations", { replace: true });
        return;
      }
      await contactsApi.remove(confirm.item.id);
      toast.success("Contact deleted");
      setConfirm(null);
      refresh();
    } catch (e) { toast.error(e.message); }
    setBusy(false);
  };

  const list = (contacts.data ?? []).filter((c) => showInactive || c.isActive);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={o.name} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{o.name}</h1>
              <div className="mt-1"><StatusBadge active={o.isActive} /></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/organizations/${o.id}/edit`} className={buttonClass("secondary")}><Pencil className="size-4" /> Edit</Link>
            <Button variant="secondary" onClick={toggleOrg}><Power className="size-4" /> {o.isActive ? "Deactivate" : "Activate"}</Button>
            <Button variant="danger" onClick={() => setConfirm({ type: "org" })}><Trash2 className="size-4" /> Delete</Button>
          </div>
        </div>

        {o.description && <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-600">{o.description}</p>}

        <div className="mt-6 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <Detail icon={Tags} label="Industry">{o.industry?.name}</Detail>
          <Detail icon={Globe} label="Website">
            {o.website && <a href={o.website} target="_blank" rel="noreferrer" className="break-all text-indigo-600 hover:underline">{o.website.replace(/^https?:\/\//, "")}</a>}
          </Detail>
          <Detail icon={Hash} label="Tax ID">{o.taxId}</Detail>
          <Detail icon={Calendar} label="Founded">{o.foundedDate ? formatDate(o.foundedDate) : null}</Detail>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Contacts <span className="ml-1 text-sm font-normal text-slate-500">({o._count.contacts})</span></h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="size-4 rounded border-slate-300 text-indigo-600" />
              Show inactive
            </label>
            <Button variant="secondary" size="sm" onClick={() => contactsApi.exportCsv({ organizationId: o.id }).catch((e) => toast.error(e.message))}>
              <Download className="size-4" /> Export
            </Button>
            <Link to={`/organizations/${o.id}/contacts/new`} className={buttonClass("primary", "sm")}><Plus className="size-4" /> Add contact</Link>
          </div>
        </div>
        <DataBoundary
          query={contacts}
          isEmpty={list.length === 0}
          empty={<EmptyState icon={Users} title="No contacts" description="Add the people you work with at this organization." />}
        >
          <ContactsTable contacts={list} onToggle={toggleContact} onDelete={(c) => setConfirm({ type: "contact", item: c })} />
        </DataBoundary>
      </Card>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === "org" ? "Delete organization?" : "Delete contact?"}
        message={
          confirm?.type === "org"
            ? `“${o.name}” and all ${o._count.contacts} of its contacts will be permanently deleted.`
            : confirm && `${confirm.item.firstName} ${confirm.item.lastName} will be permanently deleted.`
        }
        loading={busy}
        onConfirm={doDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
