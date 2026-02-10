import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeMessage, isValidId } from "@/lib/sanitize";
import { rateLimiters, getRateLimitHeaders } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/messages/conversations/[id] - Get all messages in a conversation
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { studentId: userId },
          { tutorId: userId },
        ],
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        tutor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        read: false,
        senderId: { not: userId },
      },
      data: { read: true },
    });

    const isStudent = conversation.studentId === userId;
    const otherUser = isStudent ? conversation.tutor : conversation.student;

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        otherUser,
        isStudent,
      },
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages/conversations/[id] - Send a message in a conversation
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limit: 30 messages per minute per user
    const rateLimitResult = rateLimiters.relaxed(`message:${session.user.id}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { id: conversationId } = await params;
    const userId = session.user.id;
    const body = await req.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // Validate conversation ID
    if (!isValidId(conversationId)) {
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 }
      );
    }

    // Sanitize message content
    const sanitizedContent = sanitizeMessage(content);
    if (!sanitizedContent) {
      return NextResponse.json(
        { error: "Invalid message content" },
        { status: 400 }
      );
    }

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { studentId: userId },
          { tutorId: userId },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Tutors can only reply in existing conversations (already checked by finding the conversation)
    // Students can always message in their conversations

    // Create the message with sanitized content
    const message = await prisma.message.create({
      data: {
        content: sanitizedContent,
        senderId: userId,
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update conversation's updatedAt and lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { 
        updatedAt: new Date(),
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
