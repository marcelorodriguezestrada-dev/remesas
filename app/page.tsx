import CotizadorUsdArs from "@/components/CotizadorUsdArs";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <CotizadorUsdArs />
    </div>
  );
}
