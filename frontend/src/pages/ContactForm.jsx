import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { contactsApi, organizationsApi } from "../api";
import { useQuery } from "../hooks/useQuery";
import { useToast } from "../components/Toast";
import { Button, buttonClass, Card, CheckboxField, ErrorState, PageHeader, SelectField, Spinner, TextAreaField, TextField } from "../components/ui";

const empty = {
  firstName: "", lastName: "", jobTitle: "", department: "", email: "",
  officePhoneNumber: "", mobilePhoneNumber: "", notes: "", isPrimaryContact: false,
};

export default function ContactForm() {
  const { id, orgId } = useParams(); // id => editing, orgId => adding under an organization
  const editing = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [form, setForm] = useState(empty);
  const [organizationId, setOrganizationId] = useState(orgId || "");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const orgs = useQuery(() => organizationsApi.options(), []);
  const contact = useQuery(() => (editing ? contactsApi.get(id) : Promise.resolve(null)), [id]);

  useEffect(() => {
    const c = contact.data;
    if (!c) return;
    setOrganizationId(String(c.organizationId));
    setForm({
      firstName: c.firstName, lastName: c.lastName, jobTitle: c.jobTitle ?? "", department: c.department ?? "",
      email: c.email ?? "", officePhoneNumber: c.officePhoneNumber ?? "", mobilePhoneNumber: c.mobilePhoneNumber ?? "",
      notes: c.notes ?? "", isPrimaryContact: c.isPrimaryContact,
    });
  }, [contact.data]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const backTo = location.state?.from || (organizationId ? `/organizations/${organizationId}` : "/contacts");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!editing && !organizationId) {
      setErrors({ organizationId: "Select an organization" });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      if (editing) await contactsApi.update(id, form);
      else await organizationsApi.createContact(organizationId, form);
      toast.success(`Contact ${editing ? "updated" : "created"}`);
      navigate(backTo);
    } catch (err) {
      if (err.fieldErrors && Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
      else toast.error(err.message);
      setSaving(false);
    }
  };

  if (editing && contact.loading && !contact.data) return <Spinner />;
  if (editing && contact.error) return <ErrorState error={contact.error} onRetry={contact.reload} />;

  return (
    <>
      <PageHeader title={editing ? "Edit contact" : "Add contact"} />
      <Card className="max-w-2xl p-6">
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <SelectField
            label="Organization"
            name="organizationId"
            required
            value={organizationId}
            onChange={(e) => { setOrganizationId(e.target.value); setErrors((er) => ({ ...er, organizationId: undefined })); }}
            disabled={editing || Boolean(orgId)}
            hint={editing ? "A contact can't be moved to another organization." : undefined}
            error={errors.organizationId}
          >
            <option value="">Select organization…</option>
            {(orgs.data ?? []).map((o) => (
              <option key={o.id} value={o.id}>{o.name}{o.isActive ? "" : " (inactive)"}</option>
            ))}
          </SelectField>

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="First name" name="firstName" required value={form.firstName} onChange={onChange} error={errors.firstName} autoFocus />
            <TextField label="Last name" name="lastName" required value={form.lastName} onChange={onChange} error={errors.lastName} />
            <TextField label="Job title" name="jobTitle" value={form.jobTitle} onChange={onChange} error={errors.jobTitle} />
            <TextField label="Department" name="department" value={form.department} onChange={onChange} error={errors.department} />
          </div>
          <TextField label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Office phone" name="officePhoneNumber" type="tel" value={form.officePhoneNumber} onChange={onChange} error={errors.officePhoneNumber} />
            <TextField label="Mobile phone" name="mobilePhoneNumber" type="tel" value={form.mobilePhoneNumber} onChange={onChange} error={errors.mobilePhoneNumber} />
          </div>
          <TextAreaField label="Notes" name="notes" value={form.notes} onChange={onChange} error={errors.notes} />
          <CheckboxField
            label="Primary contact"
            name="isPrimaryContact"
            hint="Only one contact per organization can be primary; this replaces the current one."
            checked={form.isPrimaryContact}
            onChange={onChange}
          />
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
            <Link to={backTo} className={buttonClass("secondary")}>Cancel</Link>
            <Button type="submit" loading={saving}>{editing ? "Save changes" : "Create contact"}</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
