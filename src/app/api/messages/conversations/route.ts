import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/messages/conversations - List all conversations for the user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
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
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            read: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                senderId: { not: userId },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Transform the data for easier consumption
    const transformedConversations = conversations.map((conv) => {
      const isStudent = conv.studentId === userId;
      const otherUser = isStudent ? conv.tutor : conv.student;
      const lastMessage = conv.messages[0] || null;
      
      return {
        id: conv.id,
        otherUser,
        lastMessage,
        unreadCount: conv._count.messages,
        updatedAt: conv.updatedAt,
        isStudent,
      };
    });

    return NextResponse.json({
      success: true,
      conversations: transformedConversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/messages/conversations - Start a new conversation (students only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();
    const { tutorId, message } = body;

    if (!tutorId) {
      return NextResponse.json(
        { error: "Tutor ID is required" },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Check if the user is trying to message themselves
    if (tutorId === userId) {
      return NextResponse.json(
        { error: "You cannot message yourself" },
        { status: 400 }
      );
    }

    // Check if user is a student (not a tutor)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === "TUTOR") {
      return NextResponse.json(
        { error: "Tutors cannot initiate conversations. Only students can start messages." },
        { status: 403 }
      );
    }

    // Verify that the tutorId belongs to an actual tutor
    const tutor = await prisma.user.findUnique({
      where: { id: tutorId },
      select: { id: true, role: true, firstName: true },
    });

    if (!tutor) {
      return NextResponse.json(
        { error: "Tutor not found" },
        { status: 404 }
      );
    }

    if (tutor.role !== "TUTOR") {
      return NextResponse.json(
        { error: "You can only message tutors" },
        { status: 400 }
      );
    }

    // Check if a conversation already exists between them
    let conversation = await prisma.conversation.findFirst({
      where: {
        studentId: userId,
        tutorId: tutorId,
      },
    });

    if (conversation) {
      // Conversation exists, just add the new message
      const newMessage = await prisma.message.create({
        data: {
          content: message.trim(),
          senderId: userId,
          conversationId: conversation.id,
        },
      });

      // Update conversation's updatedAt
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        conversation: { id: conversation.id },
        message: newMessage,
        isNew: false,
      });
    }

    // Create new conversation with the first message
    const newConversation = await prisma.conversation.create({
      data: {
        studentId: userId,
        tutorId: tutorId,
        messages: {
          create: {
            content: message.trim(),
            senderId: userId,
          },
        },
      },
    });

    // Get the first message
    const firstMessage = await prisma.message.findFirst({
      where: { conversationId: newConversation.id },
    });

    return NextResponse.json({
      success: true,
      conversation: { id: newConversation.id },
      message: firstMessage,
      isNew: true,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
