import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import BackgroundGlows from "./components/layout/BackgroundGlows";
import SlidingDrawer from "./components/layout/SlidingDrawer";

const Dashboard            = lazy(() => import("./pages/Dashboard"));
const AICopilot            = lazy(() => import("./pages/AICopilot"));
const KnowledgeGraph       = lazy(() => import("./pages/KnowledgeGraph"));
const DocumentIntelligence = lazy(() => import("./pages/DocumentIntelligence"));
const PredictiveMaintenance= lazy(() => import("./pages/PredictiveMaintenance"));
const RCAReport            = lazy(() => import("./pages/RCAReport"));
const ComplianceIntelligence=lazy(() => import("./pages/ComplianceIntelligence"));
const AuditPackage         = lazy(() => import("./pages/AuditPackage"));
const LessonsLearned       = lazy(() => import("./pages/LessonsLearned"));
const PIDExplorer          = lazy(() => import("./pages/PIDExplorer"));
const EquipmentDetails     = lazy(() => import("./pages/EquipmentDetails"));
const Settings             = lazy(() => import("./pages/Settings"));

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center relative z-10" style={{ background: "#060B14" }}>
      <div className="flex gap-1.5">
        {[0,1,2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-[#4F9DFF] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden relative" style={{ background: "#060B14" }}>
        {/* Background Mesh Glows */}
        <BackgroundGlows />

        {/* Layout content sitting on top of glows */}
        <Sidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden relative z-10">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"                element={<Dashboard />} />
              <Route path="/copilot"         element={<AICopilot />} />
              <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
              <Route path="/documents"       element={<DocumentIntelligence />} />
              <Route path="/maintenance"     element={<PredictiveMaintenance />} />
              <Route path="/rca"             element={<RCAReport />} />
              <Route path="/compliance"      element={<ComplianceIntelligence />} />
              <Route path="/audit"           element={<AuditPackage />} />
              <Route path="/lessons"         element={<LessonsLearned />} />
              <Route path="/pid"             element={<PIDExplorer />} />
              <Route path="/equipment/:id"   element={<EquipmentDetails />} />
              <Route path="/settings"        element={<Settings />} />
            </Routes>
          </Suspense>
        </main>

        {/* Global Operations Console Sliding Drawer */}
        <SlidingDrawer />
      </div>
    </BrowserRouter>
  );
}
