import { Link } from "react-router-dom";
import { Building2, CheckCircle2, Plus, Tags, UserCheck, Users } from "lucide-react";
import { statsApi } from "../api";
import { useQuery } from "../hooks/useQuery";
import { Avatar, buttonClass, Card, DataBoundary, EmptyState, PageHeader } from "../components/ui";
import { fullName } from "../lib/format";

function StatCard({ icon: Icon, label, value, sub, tone }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <span className={`inline-flex size-11 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const query = useQuery(() => statsApi.overview(), []);
  const s = query.data;
  const max = s ? Math.max(1, ...s.byIndustry.map((i) => i.count)) : 1;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="An overview of your organizations and contacts."
        actions={
          <>
            <Link to="/contacts/new" className={buttonClass("secondary")}>
              <Plus className="size-4" /> Contact
            </Link>
            <Link to="/organizations/new" className={buttonClass("primary")}>
              <Plus className="size-4" /> Organization
            </Link>
          </>
        }
      />

      <DataBoundary query={query} isEmpty={false}>
        {s && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Building2} label="Organizations" value={s.totals.organizations}
                sub={`${s.totals.activeOrganizations} active`} tone="bg-indigo-50 text-indigo-600" />
              <StatCard icon={CheckCircle2} label="Active organizations" value={s.totals.activeOrganizations}
                tone="bg-emerald-50 text-emerald-600" />
              <StatCard icon={Users} label="Contacts" value={s.totals.contacts}
                sub={`${s.totals.activeContacts} active`} tone="bg-sky-50 text-sky-600" />
              <StatCard icon={Tags} label="Industries" value={s.totals.industries}
                tone="bg-amber-50 text-amber-600" />
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="p-5 lg:col-span-2">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">Organizations by industry</h2>
                {s.byIndustry.length === 0 ? (
                  <p className="text-sm text-slate-500">No data yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {s.byIndustry.map((i) => (
                      <li key={i.name}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-slate-700">{i.name}</span>
                          <span className="font-medium text-slate-900">{i.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(i.count / max) * 100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="lg:col-span-3">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <h2 className="text-sm font-semibold text-slate-900">Recently added organizations</h2>
                  <Link to="/organizations" className="text-sm text-indigo-600 hover:underline">View all</Link>
                </div>
                {s.recentOrganizations.length === 0 ? (
                  <EmptyState icon={Building2} title="No organizations yet" />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {s.recentOrganizations.map((o) => (
                      <li key={o.id}>
                        <Link to={`/organizations/${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                          <Avatar name={o.name} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">{o.name}</p>
                            <p className="text-xs text-slate-500">{o.industry?.name || "No industry"}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <Card>
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-900">Recently added contacts</h2>
                <Link to="/contacts" className="text-sm text-indigo-600 hover:underline">View all</Link>
              </div>
              {s.recentContacts.length === 0 ? (
                <EmptyState icon={UserCheck} title="No contacts yet" />
              ) : (
                <ul className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0">
                  {s.recentContacts.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar name={fullName(c)} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{fullName(c)}</p>
                        <p className="truncate text-xs text-slate-500">
                          {c.jobTitle ? `${c.jobTitle} · ` : ""}{c.organization?.name}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </DataBoundary>
    </>
  );
}
