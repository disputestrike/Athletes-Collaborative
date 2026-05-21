import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Search, Send, MessageSquare, Clock } from "lucide-react";

function formatRelativeTime(date: Date | string | null) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
}

export default function AdminMessages() {
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threads, refetch: refetchThreads } = trpc.messages.getThreads.useQuery();
  const { data: messages, refetch: refetchMessages } = trpc.messages.getMessages.useQuery(
    { threadId: selectedThreadId! },
    { enabled: !!selectedThreadId, refetchInterval: 5000 }
  );

  const sendMutation = trpc.messages.sendMessage.useMutation({
    onSuccess: () => { setNewMessage(""); refetchMessages(); refetchThreads(); },
    onError: (e) => toast.error(e.message),
  });

  const markReadMutation = trpc.messages.markRead.useMutation();

  useEffect(() => {
    if (selectedThreadId) markReadMutation.mutate({ threadId: selectedThreadId });
  }, [selectedThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredThreads = threads?.filter(t =>
    !search || t.subject.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const selectedThread = threads?.find(t => t.id === selectedThreadId);

  return (
    <div className="space-y-4">
      <PageHeader title="Messages" subtitle="All message threads across the platform" />

      <div className="flex h-[calc(100vh-220px)] rounded-xl border border-border overflow-hidden">
        {/* Thread list */}
        <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search threads..." className="pl-9 h-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No threads found</p>
              </div>
            ) : filteredThreads.map(thread => (
              <button
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors",
                  selectedThreadId === thread.id && "bg-primary/5 border-l-2 border-l-primary"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm truncate">{thread.subject}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(thread.createdAt)}
                  </span>
                </div>
                {thread.athleteId && (
                  <p className="text-xs text-muted-foreground mt-0.5">Athlete #{thread.athleteId}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Message view */}
        <div className="flex-1 flex flex-col">
          {!selectedThreadId ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquare className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <h3 className="font-semibold text-lg mb-1">Select a conversation</h3>
              <p className="text-sm text-muted-foreground">Choose a thread from the left to view messages</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-border bg-muted/20">
                <h3 className="font-semibold">{selectedThread?.subject}</h3>
                {selectedThread?.athleteId && (
                  <p className="text-xs text-muted-foreground">Athlete #{selectedThread.athleteId}</p>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!messages || messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  </div>
                ) : messages.map(msg => (
                  <div key={msg.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {String(msg.senderId).slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold">User #{msg.senderId}</span>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(msg.sentAt)}</span>
                        {msg.isRead && <Badge variant="outline" className="text-xs h-4 px-1">Read</Badge>}
                      </div>
                      <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">{msg.body}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose */}
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage.trim()) sendMutation.mutate({ threadId: selectedThreadId, body: newMessage.trim() });
                      }
                    }}
                  />
                  <Button
                    onClick={() => { if (newMessage.trim()) sendMutation.mutate({ threadId: selectedThreadId, body: newMessage.trim() }); }}
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Press Enter to send, Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
