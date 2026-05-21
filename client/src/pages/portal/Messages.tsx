import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PageHeader, EmptyState, formatRelativeTime } from "@/components/shared";
import { toast } from "sonner";
import { MessageSquare, Send, Plus, Search, Archive, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Messages() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [newThreadDialog, setNewThreadDialog] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newFirstMsg, setNewFirstMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threads, isLoading: threadsLoading } = trpc.messages.getThreads.useQuery();
  const { data: messages, isLoading: messagesLoading } = trpc.messages.getMessages.useQuery(
    { threadId: selectedThreadId! },
    { enabled: !!selectedThreadId, refetchInterval: 5000 }
  );

  const sendMutation = trpc.messages.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      utils.messages.getMessages.invalidate({ threadId: selectedThreadId! });
      utils.messages.getThreads.invalidate();
      utils.messages.getUnreadCount.invalidate();
    },
    onError: () => toast.error("Failed to send message"),
  });

  const createThreadMutation = trpc.messages.createThread.useMutation({
    onSuccess: (thread) => {
      setNewThreadDialog(false);
      setNewSubject("");
      setNewFirstMsg("");
      utils.messages.getThreads.invalidate();
      if (thread) setSelectedThreadId(thread.id);
    },
    onError: () => toast.error("Failed to create conversation"),
  });

  const markReadMutation = trpc.messages.markRead.useMutation();

  useEffect(() => {
    if (selectedThreadId) {
      markReadMutation.mutate({ threadId: selectedThreadId });
      utils.messages.getUnreadCount.invalidate();
    }
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
      <PageHeader title="Messages" subtitle="Communicate with your team and management">
        <Button onClick={() => setNewThreadDialog(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />New Conversation
        </Button>
      </PageHeader>

      <div className="flex gap-0 bg-card border border-border rounded-xl overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        {/* Thread list */}
        <div className={cn(
          "flex flex-col border-r border-border",
          selectedThreadId ? "hidden md:flex w-80 flex-shrink-0" : "flex flex-1 md:w-80 md:flex-none"
        )}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {threadsLoading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              filteredThreads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50",
                    selectedThreadId === thread.id && "bg-accent"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-medium text-sm truncate">{thread.subject}</p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{formatRelativeTime(thread.lastMessageAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message view */}
        <div className={cn("flex flex-col flex-1", !selectedThreadId && "hidden md:flex")}>
          {!selectedThreadId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Select a conversation to read messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <button onClick={() => setSelectedThreadId(null)} className="md:hidden p-1 hover:bg-muted rounded">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <div>
                  <p className="font-semibold text-sm">{selectedThread?.subject}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messagesLoading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}</div>
                ) : !messages || messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No messages yet</div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={cn("flex gap-3", isMe && "flex-row-reverse")}>
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className={cn("text-xs font-bold", isMe ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
                            {isMe ? "Me" : "TM"}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn("max-w-[70%] space-y-1", isMe && "items-end flex flex-col")}>
                          <div className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm",
                            isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
                          )}>
                            {msg.body}
                          </div>
                          <p className="text-xs text-muted-foreground px-1">{formatRelativeTime(msg.sentAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    rows={2}
                    className="resize-none flex-1 text-sm"
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage.trim()) {
                          sendMutation.mutate({ threadId: selectedThreadId, body: newMessage.trim() });
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      if (newMessage.trim()) sendMutation.mutate({ threadId: selectedThreadId, body: newMessage.trim() });
                    }}
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    size="icon"
                    className="h-full aspect-square"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 px-1">Press Enter to send, Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Thread Dialog */}
      <Dialog open={newThreadDialog} onOpenChange={setNewThreadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Subject</Label>
              <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="What's this about?" className="mt-1" />
            </div>
            <div>
              <Label>First Message</Label>
              <Textarea value={newFirstMsg} onChange={e => setNewFirstMsg(e.target.value)} placeholder="Write your message..." rows={4} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewThreadDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createThreadMutation.mutate({ subject: newSubject, firstMessage: newFirstMsg, participantIds: [] })}
              disabled={!newSubject || !newFirstMsg || createThreadMutation.isPending}
            >
              {createThreadMutation.isPending ? "Creating..." : "Start Conversation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
