import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { industriesApi, organizationsApi } from "../api";
import { useQuery } from "../hooks/useQuery";
import { useToast } from "../components/Toast";
import { Button, buttonClass, Card, ErrorState, PageHeader, SelectField, Spinner, TextAreaField, TextField } from "../components/ui";
import { toDateInput, todayISO } from "../lib/format";

const empty = { name: "", industryId: "", website: "", logoUrl: "", foundedDate: "", taxId: "", description: "" };

export default function OrganizationForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const industries = useQuery(() => industriesApi.list(), []);
  const org = useQuery(() => (editing ? organizationsApi.get(id) : Promise.resolve(null)), [id]);

  useEffect(() => {
    const o = org.data;
    if (!o) return;
    setForm({
      name: o.name,
      industryId: o.industryId ?? "",
      website: o.website ?? "",
      logoUrl: o.logoUrl ?? "",
      foundedDate: toDateInput(o.foundedDate),
      taxId: o.taxId ?? "",
      description: o.description ?? "",
    });
  }, [org.data]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const saved = editing
        ? await organizationsApi.update(id, form)
        : await organizationsApi.create(form);
      toast.success(`${saved.name} ${editing ? "updated" : "created"}`);
      navigate(`/organizations/${saved.id}`);
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
      else toast.error(err.message);
      setSaving(false);
    }
  };

  if (editing && org.loading && !org.data) return <Spinner />;
  if (editing && org.error) return <ErrorState error={org.error} onRetry={org.reload} />;

  return (
    <>
      <PageHeader title={editing ? "Edit organization" : "Add organization"} />
      <Card className="max-w-2xl p-6">
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <TextField label="Name" name="name" required value={form.name} onChange={onChange} error={errors.name} autoFocus />
          <SelectField label="Industry" name="industryId" value={form.industryId} onChange={onChange} error={errors.industryId}>
            <option value="">No industry</option>
            {(industries.data ?? []).map((i) => (
              <option key={i.id} value={i.id}>{i.name}{i.isActive ? "" : " (inactive)"}</option>
            ))}
          </SelectField>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Website" name="website" placeholder="example.com" value={form.website} onChange={onChange} error={errors.website} />
            <TextField label="Tax ID" name="taxId" value={form.taxId} onChange={onChange} error={errors.taxId} />
            <TextField label="Founded" name="foundedDate" type="date" max={todayISO()} value={form.foundedDate} onChange={onChange} error={errors.foundedDate} />
            <TextField label="Logo URL" name="logoUrl" placeholder="https://…/logo.png" value={form.logoUrl} onChange={onChange} error={errors.logoUrl} />
          </div>
          <TextAreaField label="Description" name="description" rows={4} value={form.description} onChange={onChange} error={errors.description} />
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
            <Link to={editing ? `/organizations/${id}` : "/organizations"} className={buttonClass("secondary")}>Cancel</Link>
            <Button type="submit" loading={saving}>{editing ? "Save changes" : "Create organization"}</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
