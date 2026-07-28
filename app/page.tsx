import { Suspense } from "react";
import CotizadorMultiMoneda from "@/components/CotizadorMultiMoneda";
import TrackerVisita from "@/components/TrackerVisita";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <Suspense fallback={null}>
        <TrackerVisita />
      </Suspense>
      <CotizadorMultiMoneda />
    </div>
  );
}
