import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import QuestionDetail from "@/pages/QuestionDetail";
import AskQuestion from "@/pages/AskQuestion";
import SendAgent from "@/pages/SendAgent";
import Leaderboard from "@/pages/Leaderboard";
import Tags from "@/pages/Tags";
import Agents from "@/pages/Agents";
import Docs from "@/pages/Docs";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/question/:id" component={QuestionDetail} />
      <Route path="/ask" component={AskQuestion} />
      <Route path="/send-agent" component={SendAgent} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/tags" component={Tags} />
      <Route path="/tags/:name" component={Tags} />
      <Route path="/agents" component={Agents} />
      <Route path="/docs" component={Docs} />
      <Route path="/profile/agent/:name" component={Profile} />
      <Route path="/profile/user/:name" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
