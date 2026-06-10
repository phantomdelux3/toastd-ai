import { Suspense } from "react";
import { ChatView } from "./ChatView";
import ChatLoading from "./loading";

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatView />
    </Suspense>
  );
}
