import { act } from '@testing-library/react';
import { useChatStore } from '@/store/chatStore';

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({ conversations: [], activeConversationId: null, messages: {} });
  });

  it('cleanupOldMessages should remove messages older than 24 hours', () => {
    const conversationId = 'convo-1';
    
    // Create timestamps
    const now = Date.now();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    const twentyFiveHoursAgo = new Date(now - 25 * 60 * 60 * 1000).toISOString();

    const oldMessage = {
      id: 'old-1',
      conversationId,
      senderId: 'user-1',
      senderPseudo: 'Alice',
      ciphertext: 'c',
      encryptedKey: 'ek',
      encryptedKeyForSender: 'eks',
      iv: 'iv',
      sentAt: twentyFiveHoursAgo, // > 24h
      readAt: null,
      decryptedContent: 'old message',
    };

    const recentMessage = {
      id: 'recent-1',
      conversationId,
      senderId: 'user-1',
      senderPseudo: 'Alice',
      ciphertext: 'c2',
      encryptedKey: 'ek2',
      encryptedKeyForSender: 'eks2',
      iv: 'iv2',
      sentAt: twoHoursAgo, // < 24h
      readAt: null,
      decryptedContent: 'recent message',
    };

    // Set initial state
    useChatStore.setState({
      messages: {
        [conversationId]: [oldMessage, recentMessage],
      },
    });

    // Act
    act(() => {
      useChatStore.getState().cleanupOldMessages();
    });

    // Assert
    const storedMessages = useChatStore.getState().messages[conversationId];
    expect(storedMessages).toHaveLength(1);
    expect(storedMessages[0].id).toBe('recent-1');
  });

  it('clearChatStore should reset all state', () => {
    useChatStore.setState({
      conversations: [{ id: '1', unreadCount: 0, createdAt: '', lastMessageAt: null, otherParticipant: { id: '2', pseudo: 'P', firstName: '', lastName: '', publicKey: '' } }],
      activeConversationId: '1',
      messages: { '1': [] }
    });

    act(() => {
      useChatStore.getState().clearChatStore();
    });

    const state = useChatStore.getState();
    expect(state.conversations).toHaveLength(0);
    expect(state.activeConversationId).toBeNull();
    expect(Object.keys(state.messages)).toHaveLength(0);
  });
});
