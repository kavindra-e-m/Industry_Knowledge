import PageShell from "../components/shared/PageShell";

export default function Settings() {
  return (
    <PageShell topbarPlaceholder="Search settings...">
      <div className="flex items-center justify-center h-full" style={{ background: "#07111F" }}>
        <div className="text-center">
          <p className="text-4xl mb-3 opacity-20">⚙</p>
          <p className="text-[#4A6080] text-sm font-jakarta">Settings — coming soon</p>
        </div>
      </div>
    </PageShell>
  );
}
