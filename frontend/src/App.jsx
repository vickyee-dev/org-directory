import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import Layout from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import Dashboard from "./pages/Dashboard";
import OrganizationList from "./pages/OrganizationList";
import OrganizationDetail from "./pages/OrganizationDetail";
import OrganizationForm from "./pages/OrganizationForm";
import ContactList from "./pages/ContactList";
import ContactForm from "./pages/ContactForm";
import IndustryList from "./pages/IndustryList";
import NotFound from "./pages/NotFound";

// Old URL (/organizations/:orgId/contacts) now lives on the organization page.
function ToOrganization() {
  const { orgId } = useParams();
  return <Navigate to={`/organizations/${orgId}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />

            <Route path="organizations" element={<OrganizationList />} />
            <Route path="organizations/new" element={<OrganizationForm />} />
            <Route path="organizations/:id" element={<OrganizationDetail />} />
            <Route path="organizations/:id/edit" element={<OrganizationForm />} />
            <Route path="organizations/:orgId/contacts" element={<ToOrganization />} />
            <Route path="organizations/:orgId/contacts/new" element={<ContactForm />} />

            <Route path="contacts" element={<ContactList />} />
            <Route path="contacts/new" element={<ContactForm />} />
            <Route path="contacts/:id/edit" element={<ContactForm />} />

            <Route path="industries" element={<IndustryList />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
