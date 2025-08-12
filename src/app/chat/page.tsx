import { ChatInterface } from "@/components/chat-interface";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function ChatPage() {
    return (
        <DashboardLayout>
            <div className="p-4 md:p-8">
                <ChatInterface />
            </div>
        </DashboardLayout>
    );
}
