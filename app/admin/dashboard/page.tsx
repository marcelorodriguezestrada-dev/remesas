import PanelNoticias from "@/components/PanelNoticias";
import GraficoEvolucion from "@/components/GraficoEvolucion";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-6">
      <h2 className="mb-6 text-xl font-semibold text-zinc-900">Dashboard</h2>

      <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
        <GraficoEvolucion />
      </div>

      <PanelNoticias />
    </div>
  );
}
