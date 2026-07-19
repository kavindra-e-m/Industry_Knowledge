import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./components/layout/Sidebar";
import BackgroundGlows from "./components/layout/BackgroundGlows";
import SlidingDrawer from "./components/layout/SlidingDrawer";
import AnimatedBackground from "./components/shared/AnimatedBackground";
import FloatingAIAssistant from "./components/shared/FloatingAIAssistant";
import ToastContainer from "./components/shared/ToastContainer";

const Dashboard             = lazy(() => import("./pages/Dashboard"));
const AICopilot             = lazy(() => import("./pages/AICopilot"));
const KnowledgeGraph        = lazy(() => import("./pages/KnowledgeGraph"));
const DocumentIntelligence  = lazy(() => import("./pages/DocumentIntelligence"));
const PredictiveMaintenance = lazy(() => import("./pages/PredictiveMaintenance"));
const RCAReport             = lazy(() => import("./pages/RCAReport"));
const ComplianceIntelligence= lazy(() => import("./pages/ComplianceIntelligence"));
const AuditPackage          = lazy(() => import("./pages/AuditPackage"));
const LessonsLearned        = lazy(() => import("./pages/LessonsLearned"));
const PIDExplorer           = lazy(() => import("./pages/PIDExplorer"));
const EquipmentDetails      = lazy(() => import("./pages/EquipmentDetails"));
const Settings              = lazy(() => import("./pages/Settings"));

function PageLoader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 relative z-10" style={{ background: "#060B14" }}>
      <motion.div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #4F9DFF22, #7C5CFC22)", border: "1px solid rgba(79,157,255,0.2)" }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-5 h-5 rounded-lg" style={{ background: "linear-gradient(135deg, #4F9DFF, #7C5CFC)" }} />
      </motion.div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#4F9DFF]"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
          />
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
        <AnimatedBackground />

        <div className="relative z-10 flex w-full h-full">
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
        </div>

        {/* Global Operations Console Sliding Drawer */}
        <SlidingDrawer />

        <FloatingAIAssistant />
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}
