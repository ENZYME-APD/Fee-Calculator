import { Navigation } from "@/components/layout/Navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Monitor } from "lucide-react";
import { UndoProvider } from "@/lib/context/UndoContext";
import { GlobalToast } from "@/components/ui/Toast";
import { WelcomeOverlay } from "@/components/WelcomeOverlay";
import { TourProvider } from "@/lib/context/TourContext";
import { TourOverlay } from "@/components/ui/TourOverlay";

export default function AppLayoutGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="md:hidden flex flex-col items-center justify-center h-full w-full p-6 bg-slate-50 dark:bg-slate-950 text-center text-slate-900 dark:text-slate-100">
        <div className="mb-10">
          <img src="/logo-dark.png" alt="Enzyme APD" className="h-8 w-auto dark:hidden" />
          <img src="/logo-light.png" alt="Enzyme APD" className="h-8 w-auto hidden dark:block" />
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none max-w-sm w-full border border-slate-200 dark:border-slate-800 flex flex-col items-center">
          <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
            <Monitor size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-black tracking-tight mb-4 text-slate-800 dark:text-slate-200">Desktop Recommended</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
            This app is temporarily not available on mobile. The experience is curated for larger horizontal screens (desktop/tablet).
          </p>
          <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-6"></div>
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Thank You
          </p>
        </div>
      </div>
      <div className="hidden md:flex h-full overflow-hidden w-full">
        <Navigation />
        <main className="flex-1 overflow-hidden h-full relative flex flex-col">
          <ProtectedRoute>
            <TourProvider>
              <UndoProvider>
                {children}
              </UndoProvider>
              <TourOverlay />
              <WelcomeOverlay />
            </TourProvider>
          </ProtectedRoute>
        </main>
      </div>
      <GlobalToast />
    </>
  );
}
