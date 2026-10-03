import { Link, useLocation } from "react-router-dom";
import { Mail, Pencil, Phone, Power, Star, Trash2 } from "lucide-react";
import { Avatar, IconButton, StatusBadge } from "./ui";
import { fullName } from "../lib/format";

/**
 * Shared contacts table.
 * `showOrganization` adds an organization column (used on the global contacts page).
 */
export default function ContactsTable({ contacts, showOrganization = false, onToggle, onDelete }) {
  const location = useLocation();
  const from = location.pathname + location.search;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            {showOrganization && <th className="px-4 py-3 font-medium">Organization</th>}
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {contacts.map((c) => (
            <tr key={c.id} className={`hover:bg-slate-50/70 ${c.isActive ? "" : "text-slate-400"}`}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={fullName(c)} />
                  <div>
                    <div className="flex items-center gap-1.5 font-medium text-slate-900">
                      {fullName(c)}
                      {c.isPrimaryContact && (
                        <Star
                          className="size-3.5 fill-amber-400 text-amber-400"
                          aria-label="Primary contact"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </td>
              {showOrganization && (
                <td className="px-4 py-3">
                  {c.organization ? (
                    <Link
                      to={`/organizations/${c.organization.id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      {c.organization.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              )}
              <td className="px-4 py-3">
                <div className="text-slate-700">{c.jobTitle || "—"}</div>
                {c.department && <div className="text-xs text-slate-500">{c.department}</div>}
              </td>
              <td className="px-4 py-3">
                <div className="space-y-0.5 text-slate-600">
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-indigo-600">
                      <Mail className="size-3.5 shrink-0" /> {c.email}
                    </a>
                  )}
                  {(c.mobilePhoneNumber || c.officePhoneNumber) && (
                    <a
                      href={`tel:${(c.mobilePhoneNumber || c.officePhoneNumber).replace(/[^\d+]/g, "")}`}
                      className="flex items-center gap-1.5 hover:text-indigo-600"
                    >
                      <Phone className="size-3.5 shrink-0" /> {c.mobilePhoneNumber || c.officePhoneNumber}
                    </a>
                  )}
                  {!c.email && !c.mobilePhoneNumber && !c.officePhoneNumber && "—"}
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge active={c.isActive} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <IconButton label="Edit" to={`/contacts/${c.id}/edit`} state={{ from }}>
                    <Pencil className="size-4" />
                  </IconButton>
                  <IconButton label={c.isActive ? "Deactivate" : "Activate"} onClick={() => onToggle(c)}>
                    <Power className="size-4" />
                  </IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => onDelete(c)}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
