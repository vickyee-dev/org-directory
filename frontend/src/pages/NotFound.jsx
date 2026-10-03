import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { buttonClass, Card, EmptyState } from "../components/ui";

export default function NotFound() {
  return (
    <Card>
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist."
        action={<Link to="/" className={buttonClass()}>Back to dashboard</Link>}
      />
    </Card>
  );
}
