import { useState } from "react";
import { Check, Pencil, Plus, Power, Tags, Trash2, X } from "lucide-react";
import { industriesApi } from "../api";
import { useQuery } from "../hooks/useQuery";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import { Button, Card, DataBoundary, EmptyState, IconButton, inputClass, PageHeader, StatusBadge } from "../components/ui";

export default function IndustryList() {
  const toast = useToast();
  const query = useQuery(() => industriesApi.list(), []);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [edit, setEdit] = useState({ name: "", description: "" });
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn, success) => {
    try {
      await fn();
      if (success) toast.success(success);
      query.reload();
      return true;
    } catch (e) {
      toast.error(e.fieldErrors?.name ? `Name ${e.fieldErrors.name.toLowerCase()}` : e.message);
      return false;
    }
  };

  const add = async (e) => {
    e.preventDefault();
    setAdding(true);
    if (await run(() => industriesApi.create({ name: newName, description: newDesc }), "Industry added")) {
      setNewName("");
      setNewDesc("");
    }
    setAdding(false);
  };

  const save = async () => {
    if (await run(() => industriesApi.update(editId, edit), "Industry updated")) setEditId(null);
  };

  const confirmDelete = async () => {
    setBusy(true);
    if (await run(() => industriesApi.remove(toDelete.id), "Industry deleted")) setToDelete(null);
    setBusy(false);
  };

  const rows = query.data ?? [];

  return (
    <>
      <PageHeader title="Industries" subtitle="Categories used to group organizations." />

      <Card className="mb-6 p-4">
        <form onSubmit={add} className="flex flex-wrap gap-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} required maxLength={100}
            placeholder="Industry name" aria-label="Industry name" className={`${inputClass(false)} sm:!w-56`} />
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} maxLength={500}
            placeholder="Description (optional)" aria-label="Description" className={`${inputClass(false)} min-w-48 flex-1`} />
          <Button type="submit" loading={adding}><Plus className="size-4" /> Add industry</Button>
        </form>
      </Card>

      <Card>
        <DataBoundary query={query} isEmpty={rows.length === 0}
          empty={<EmptyState icon={Tags} title="No industries yet" description="Add one above to start categorizing organizations." />}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Organizations</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((ind) => {
                  const editingRow = editId === ind.id;
                  return (
                    <tr key={ind.id} className={`hover:bg-slate-50/70 ${ind.isActive ? "" : "text-slate-400"}`}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {editingRow ? (
                          <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                            aria-label="Name" className={inputClass(false)} autoFocus />
                        ) : ind.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {editingRow ? (
                          <input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                            aria-label="Description" className={inputClass(false)} />
                        ) : ind.description || "—"}
                      </td>
                      <td className="px-4 py-3">{ind._count.organizations}</td>
                      <td className="px-4 py-3"><StatusBadge active={ind.isActive} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {editingRow ? (
                            <>
                              <IconButton label="Save" onClick={save}><Check className="size-4" /></IconButton>
                              <IconButton label="Cancel" onClick={() => setEditId(null)}><X className="size-4" /></IconButton>
                            </>
                          ) : (
                            <>
                              <IconButton label="Edit" onClick={() => { setEditId(ind.id); setEdit({ name: ind.name, description: ind.description ?? "" }); }}>
                                <Pencil className="size-4" />
                              </IconButton>
                              <IconButton label={ind.isActive ? "Deactivate" : "Activate"}
                                onClick={() => run(() => industriesApi.toggle(ind.id), `${ind.name} ${ind.isActive ? "deactivated" : "activated"}`)}>
                                <Power className="size-4" />
                              </IconButton>
                              <IconButton label="Delete" tone="danger" onClick={() => setToDelete(ind)}><Trash2 className="size-4" /></IconButton>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DataBoundary>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete industry?"
        message={toDelete && `“${toDelete.name}” will be removed.${toDelete._count.organizations ? ` ${toDelete._count.organizations} organization(s) will be left without an industry.` : ""}`}
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
