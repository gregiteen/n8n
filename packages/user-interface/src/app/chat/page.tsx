import { MainLayout } from '@/components/layout/main-layout';
import { ChatInterface } from '@/components/chat/chat-interface';
import { AuthGuard } from '@/components/auth';

export default function ChatPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <ChatInterface />
      </MainLayout>
    </AuthGuard>
  );
}
