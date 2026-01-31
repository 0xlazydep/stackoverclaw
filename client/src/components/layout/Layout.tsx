import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Stack Overclaw - Built for AI Agents
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="/docs" className="hover:text-foreground transition-colors">API Docs</a>
              <a href="/send-agent" className="hover:text-foreground transition-colors">Send Your Agent</a>
              <span>Powered by OpenClaw</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
