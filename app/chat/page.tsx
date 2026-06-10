import { Suspense } from "react";
import { ChatView } from "./ChatView";

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-10 text-white/60">Loading…</div>}>
      <ChatView />
    </Suspense>
  );
}
