"use client";

import { useEffect, useState, useRef, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Send, User } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface Sender {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: Sender;
  read: boolean;
}

interface OtherUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

interface ConversationInfo {
  id: string;
  otherUser: OtherUser;
  isStudent: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, "h:mm a")}`;
  } else {
    return format(date, "MMM d, h:mm a");
  }
}

export default function ConversationPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.id;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages
  useEffect(() => {
    async function fetchMessages() {
      try {
        const response = await fetch(`/api/messages/conversations/${conversationId}`);
        const data = await response.json();

        if (data.success) {
          setConversation(data.conversation);
          setMessages(data.messages);
        } else {
          setError(data.error || "Failed to load conversation");
        }
      } catch (err) {
        setError("Failed to load conversation");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchMessages();
    }
  }, [status, conversationId]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!conversation) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/messages/conversations/${conversationId}`);
        const data = await response.json();

        if (data.success) {
          setMessages(data.messages);
        }
      } catch (err) {
        // Silently fail on polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [conversation, conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    setSending(true);
    
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      } else {
        setError(data.error || "Failed to send message");
      }
    } catch (err) {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (status === "loading" || loading) {
    return <PageLoader />;
  }

  if (error && !conversation) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/messages">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Button>
        </Link>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const otherUser = conversation?.otherUser;

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <Link href="/messages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 flex-1">
          {otherUser?.avatarUrl ? (
            <img
              src={otherUser.avatarUrl}
              alt={`${otherUser.firstName}'s avatar`}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
          )}
          
          <div>
            <h1 className="font-semibold">
              {otherUser?.firstName} {otherUser?.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {conversation?.isStudent ? "Tutor" : "Student"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === session?.user?.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-2 max-w-[75%] ${isOwn ? "flex-row-reverse" : ""}`}>
                  {/* Avatar (only for other user) */}
                  {!isOwn && (
                    <div className="flex-shrink-0 mt-auto">
                      {message.sender.avatarUrl ? (
                        <img
                          src={message.sender.avatarUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                    <p
                      className={`text-xs text-muted-foreground mt-1 ${
                        isOwn ? "text-right" : ""
                      }`}
                    >
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-700 p-2 rounded-lg text-sm mb-2">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-900 font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Message input */}
      <div className="pt-4 border-t">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim() || sending}>
            {sending ? (
              <Spinner size="sm" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
