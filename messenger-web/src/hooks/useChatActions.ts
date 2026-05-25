"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { chatService } from "@/services/chatService";
import { signalRService } from "@/lib/signalr";
import { importPublicKey } from "@/lib/crypto/keys";
import { encryptMessage, decryptMessage } from "@/lib/crypto/messages";
import { ConversationListItem, Message } from "@/lib/types";

/**
 * Custom hook that encapsulates all chat business logic:
 * - SignalR connection
 * - Conversation fetching
 * - Message encryption/decryption
 * - Sending messages
 * - Typing indicators
 */
export function useChatActions() {
  const { user, privateKey } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    setConversations,
    setActiveConversation,
    setMessages,
    addMessage,
    cleanupOldMessages,
    clearUnreadCount,
  } = useChatStore();

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const processedMsgIds = useRef<Set<string>>(new Set());

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatService.getConversations();
      if (res.success && res.data) {
        setConversations(res.data);
        res.data.forEach((c: ConversationListItem) =>
          signalRService.joinConversation(c.id)
        );
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  }, [setConversations]);

  // Open a conversation and decrypt its messages
  const openConversation = useCallback(
    async (conversationId: string) => {
      setActiveConversation(conversationId);
      clearUnreadCount(conversationId);
      if (!messages[conversationId] && user) {
        try {
          const res = await chatService.getMessages(conversationId);
          if (res.success && res.data) {
            const encryptedMessages: Message[] = res.data;
            if (privateKey) {
              const decryptedMsgs = await Promise.all(
                encryptedMessages.map(async (msg) => {
                  if (msg.senderId === user.id) {
                    if (!msg.encryptedKeyForSender) {
                      return { ...msg, decryptedContent: "Ancien message (non déchiffrable par l'expéditeur)" };
                    }
                    try {
                      const content = await decryptMessage(
                        { ciphertext: msg.ciphertext, encryptedKey: msg.encryptedKeyForSender, iv: msg.iv },
                        privateKey
                      );
                      return { ...msg, decryptedContent: content };
                    } catch {
                      return { ...msg, decryptedContent: "Ancien message (non déchiffrable par l'expéditeur)" };
                    }
                  } else {
                    try {
                      const content = await decryptMessage(
                        { ciphertext: msg.ciphertext, encryptedKey: msg.encryptedKey, iv: msg.iv },
                        privateKey
                      );
                      if (!msg.readAt) signalRService.markAsRead(conversationId, msg.id);
                      return { ...msg, decryptedContent: content };
                    } catch {
                      return { ...msg, decryptedContent: "Ce message n'a pas pu être déchiffré." };
                    }
                  }
                })
              );
              setMessages(conversationId, decryptedMsgs);
            } else {
              setMessages(
                conversationId,
                encryptedMessages.map((m) => ({ ...m, decryptedContent: "Clé privée manquante." }))
              );
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    },
    [messages, user, privateKey, setActiveConversation, setMessages, clearUnreadCount]
  );

  // Start or open a conversation with a target user
  const startOrOpenConversation = useCallback(
    async (targetUserId: string) => {
      try {
        const res = await chatService.startOrOpenConversation(targetUserId);
        if (res.success && res.data) {
          const convo = res.data;
          const currentUser = useAuthStore.getState().user;
          const currentConversations = useChatStore.getState().conversations;

          // Check if this conversation already exists locally
          const exists = currentConversations.find((c) => c.id === convo.id);
          if (!exists) {
            const otherParticipant = convo.participants.find(
              (p) => p.id !== currentUser?.id
            );
            if (otherParticipant) {
              const newItem: ConversationListItem = {
                id: convo.id,
                otherParticipant,
                lastMessageAt: convo.lastMessageAt,
                createdAt: convo.createdAt,
                unreadCount: 0,
              };
              useChatStore.getState().setConversations([newItem, ...currentConversations]);
            }
          }

          signalRService.joinConversation(convo.id);
          openConversation(convo.id);
          signalRService.syncOnlineUsers();
        }
      } catch (err) {
        console.error(err);
      }
    },
    [openConversation]
  );

  // Send an encrypted message
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !activeConversationId || !user) return false;
      const convo = conversations.find((c) => c.id === activeConversationId);
      if (!convo) return false;

      try {
        const recipientPubKey = await importPublicKey(convo.otherParticipant.publicKey);
        const senderPubKey = await importPublicKey(user.publicKey);
        const encryptedPayload = await encryptMessage(text, recipientPubKey, senderPubKey);
        const realMessage = await signalRService.sendMessage(
          activeConversationId,
          encryptedPayload.ciphertext,
          encryptedPayload.encryptedKey,
          encryptedPayload.encryptedKeyForSender || "",
          encryptedPayload.iv
        );

        if (realMessage) {
          addMessage({
            ...realMessage,
            decryptedContent: text,
          });
        }

        // Stop typing
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        isTypingRef.current = false;
        signalRService.stopTyping(activeConversationId);

        return true;
      } catch (err) {
        console.error("Failed to send message", err);
        return false;
      }
    },
    [activeConversationId, conversations, user, addMessage]
  );

  // Typing indicator
  const handleTyping = useCallback(() => {
    if (!activeConversationId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      signalRService.typing(activeConversationId);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (activeConversationId) signalRService.stopTyping(activeConversationId);
    }, 3000);
  }, [activeConversationId]);

  // Real-time decrypt effect for incoming SignalR messages
  useEffect(() => {
    if (!user) return;
    const currentMessages = useChatStore.getState().messages;

    const decryptNewMessages = async () => {
      if (!privateKey) return;

      for (const convId of Object.keys(currentMessages)) {
        const msgs = currentMessages[convId];
        // Find messages that haven't been decrypted yet
        const undecrypted = msgs.filter(
          (msg) => msg.decryptedContent === undefined && !processedMsgIds.current.has(msg.id)
        );
        if (undecrypted.length === 0) continue;

        // Mark as being processed to avoid re-entry
        undecrypted.forEach((msg) => processedMsgIds.current.add(msg.id));

        const updatedMsgs = await Promise.all(
          msgs.map(async (msg) => {
            if (msg.decryptedContent !== undefined) return msg;
            if (msg.senderId === user.id) {
              if (!msg.encryptedKeyForSender) {
                return { ...msg, decryptedContent: "Ancien message (non déchiffrable par l'expéditeur)" };
              }
              try {
                const content = await decryptMessage(
                  { ciphertext: msg.ciphertext, encryptedKey: msg.encryptedKeyForSender, iv: msg.iv },
                  privateKey
                );
                return { ...msg, decryptedContent: content };
              } catch {
                return { ...msg, decryptedContent: "Ancien message (non déchiffrable par l'expéditeur)" };
              }
            } else {
              try {
                const content = await decryptMessage(
                  { ciphertext: msg.ciphertext, encryptedKey: msg.encryptedKey, iv: msg.iv },
                  privateKey
                );
                return { ...msg, decryptedContent: content };
              } catch {
                return { ...msg, decryptedContent: "Ce message n'a pas pu être déchiffré." };
              }
            }
          })
        );
        useChatStore.getState().setMessages(convId, updatedMsgs);
      }
    };
    decryptNewMessages();
  }, [messages, user, privateKey]);

  return {
    conversations,
    activeConversationId,
    messages,
    cleanupOldMessages,
    fetchConversations,
    openConversation,
    startOrOpenConversation,
    sendMessage,
    handleTyping,
  };
}
