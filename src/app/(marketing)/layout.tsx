import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex flex-col overflow-y-auto w-full">
      <MarketingHeader />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
