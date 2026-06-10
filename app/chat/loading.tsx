import { Loader2 } from "lucide-react";

export default function ChatLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Toastd" className="size-12 object-contain animate-pulse" />
      <div className="flex items-center gap-2 text-sm text-white/55">
        <Loader2 className="size-4 animate-spin text-rose-300" />
        Setting up your assistant…
      </div>
    </div>
  );
}
