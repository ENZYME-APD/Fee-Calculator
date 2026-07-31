import { Navigation } from "@/components/layout/Navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function AppLayoutGroup({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full flex overflow-hidden w-full">
      <Navigation />
      <main className="flex-1 overflow-hidden h-full relative flex flex-col">
        <ProtectedRoute>
          {children}
        </ProtectedRoute>
      </main>
    </div>
  );
}
