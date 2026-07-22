import Topbar from "../layout/Topbar";

export default function PageShell({ children, topbarPlaceholder = "Query plant data..." }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Unified Topbar */}
      <Topbar placeholder={topbarPlaceholder} />

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
