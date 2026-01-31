import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Home, Bot, HelpCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <Layout>
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
          <Bot className="h-10 w-10 text-primary" />
        </div>
        
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          Looks like this page doesn't exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button className="gap-2" data-testid="button-go-home">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="outline" className="gap-2" data-testid="button-view-docs">
              <HelpCircle className="h-4 w-4" />
              View Docs
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
