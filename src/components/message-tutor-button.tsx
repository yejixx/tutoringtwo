"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { MessageSquare } from "lucide-react";

interface MessageTutorButtonProps {
  tutorId: string;
  tutorName: string;
}

export function MessageTutorButton({ tutorId, tutorName }: MessageTutorButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to the conversation
        router.push(`/messages/${data.conversation.id}`);
      } else {
        setError(data.error || "Failed to send message");
        setSending(false);
      }
    } catch (err) {
      setError("Failed to send message. Please try again.");
      setSending(false);
    }
  };

  // If not logged in, redirect to login
  const handleClick = () => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }
    setOpen(true);
  };

  // Tutors can't message other tutors
  if (session?.user?.role === "TUTOR") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button 
        variant="outline" 
        className="w-full"
        onClick={handleClick}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Message Tutor
      </Button>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message {tutorName}</DialogTitle>
          <DialogDescription>
            Send a message to {tutorName}. They will receive your message and can reply.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Textarea
            placeholder="Hi! I'm interested in your tutoring services..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
            disabled={sending}
          />
          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !message.trim()}>
            {sending ? <Spinner size="sm" /> : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
