"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { MessageSquare, User, Clock, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface OtherUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

interface LastMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  read: boolean;
}

interface Conversation {
  id: string;
  otherUser: OtherUser;
  lastMessage: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
  isStudent: boolean;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const response = await fetch("/api/messages/conversations");
        const data = await response.json();

        if (data.success) {
          setConversations(data.conversations);
        } else {
          setError(data.error || "Failed to load conversations");
        }
      } catch (err) {
        setError("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchConversations();
    }
  }, [status]);

  if (status === "loading" || loading) {
    return <PageLoader />;
  }

  const userRole = session?.user?.role;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">
            {userRole === "TUTOR" 
              ? "Respond to student inquiries" 
              : "Connect with your tutors"}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {conversations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
            <p className="text-muted-foreground mb-4">
              {userRole === "TUTOR"
                ? "When students message you, their conversations will appear here."
                : "Start a conversation by messaging a tutor from their profile page."}
            </p>
            {userRole !== "TUTOR" && (
              <Link href="/tutors">
                <Button>
                  Find a Tutor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <Link key={conversation.id} href={`/messages/${conversation.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center p-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {conversation.otherUser.avatarUrl ? (
                      <img
                        src={conversation.otherUser.avatarUrl}
                        alt={`${conversation.otherUser.firstName}'s avatar`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold truncate">
                        {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                      </h3>
                      {conversation.lastMessage && (
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { 
                            addSuffix: true 
                          })}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.senderId === session?.user?.id && (
                            <span className="text-muted-foreground">You: </span>
                          )}
                          {conversation.lastMessage.content}
                        </>
                      ) : (
                        <span className="italic">No messages yet</span>
                      )}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conversation.unreadCount > 0 && (
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {conversation.unreadCount}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
