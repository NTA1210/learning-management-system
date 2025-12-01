import { MessageCircle } from 'lucide-react';
import type { JSX } from 'react';

function ChatPlaceholder(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-8 text-gray-500">
      <MessageCircle className="size-16 mb-4 opacity-70" />
      <h2 className="text-lg font-semibold">Welcome to Chatty</h2>
      <p className="text-sm mt-2">Select a chat to start messaging"</p>
    </div>
  );
}

export default ChatPlaceholder;
