import OperacionesPendientes from "@/components/OperacionesPendientes";

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <OperacionesPendientes />
    </div>
  );
}
