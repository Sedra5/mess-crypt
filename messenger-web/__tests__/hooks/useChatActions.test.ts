import { renderHook, act } from '@testing-library/react';
import { useChatActions } from '@/hooks/useChatActions';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { chatService } from '@/services/chatService';
import { signalRService } from '@/lib/signalr';

// Mock the services
jest.mock('@/services/chatService', () => ({
  chatService: {
    getConversations: jest.fn(),
    startOrOpenConversation: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    markAsRead: jest.fn(),
  }
}));

jest.mock('@/lib/signalr', () => ({
  signalRService: {
    joinConversation: jest.fn(),
    sendMessage: jest.fn().mockResolvedValue({
      id: 'backend-msg-id',
      conversationId: 'c1',
      senderId: 'u1',
      senderPseudo: 'Alice',
      ciphertext: 'c',
      encryptedKey: 'ek',
      encryptedKeyForSender: 'eks',
      iv: 'i',
      sentAt: new Date().toISOString(),
      readAt: null
    }),
    notifyTyping: jest.fn(),
    stopTyping: jest.fn(),
  }
}));

// Mock crypto module because useChatActions uses getPrivateKey, importPublicKey and encryptMessage
jest.mock('@/lib/crypto/store', () => ({
  getPrivateKey: jest.fn(),
}));

jest.mock('@/lib/crypto/keys', () => ({
  importPublicKey: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/lib/crypto/messages', () => ({
  encryptMessage: jest.fn().mockResolvedValue({
    ciphertext: 'c', encryptedKey: 'ek', encryptedKeyForSender: 'eks', iv: 'i'
  }),
  decryptMessage: jest.fn(),
}));

describe('useChatActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up a fake user
    act(() => {
      useAuthStore.setState({
        user: { id: 'u1', firstName: 'A', lastName: 'B', pseudo: 'ab', email: 'a@b.com', publicKey: 'pk' },
        isAuthenticated: true,
      });
      useChatStore.setState({
        conversations: [],
        activeConversationId: null,
        messages: {}
      });
    });
  });

  it('fetchConversations should update store with fetched data', async () => {
    const mockConvos = [
      { id: 'c1', otherParticipant: { id: 'u2', pseudo: 'bob' }, unreadCount: 0 }
    ];
    
    // @ts-ignore
    chatService.getConversations.mockResolvedValueOnce({ success: true, data: mockConvos });

    const { result } = renderHook(() => useChatActions());

    await act(async () => {
      await result.current.fetchConversations();
    });

    expect(chatService.getConversations).toHaveBeenCalled();
    expect(useChatStore.getState().conversations).toEqual(mockConvos);
  });

  it('openConversation should fetch messages', async () => {
    // @ts-ignore
    chatService.getMessages.mockResolvedValueOnce({ success: true, data: [] });

    const { result } = renderHook(() => useChatActions());

    await act(async () => {
      await result.current.openConversation('c1');
    });

    expect(chatService.getMessages).toHaveBeenCalledWith('c1');
    expect(useChatStore.getState().activeConversationId).toBe('c1');
  });

  it('sendMessage should encrypt and broadcast via SignalR', async () => {
    // Setup active conversation
    act(() => {
      useChatStore.setState({
        activeConversationId: 'c1',
        conversations: [
          { 
            id: 'c1', 
            // @ts-ignore
            otherParticipant: { id: 'u2', publicKey: 'target-key' } 
          }
        ]
      });
    });

    const { result } = renderHook(() => useChatActions());

    let success = false;
    await act(async () => {
      success = await result.current.sendMessage('Hello Bob');
    });

    expect(success).toBe(true);
    expect(signalRService.sendMessage).toHaveBeenCalledWith(
      'c1', 'c', 'ek', 'eks', 'i'
    );
    
    // Message should be added to the store instantly (optimistic UI)
    const storeMessages = useChatStore.getState().messages['c1'];
    expect(storeMessages).toHaveLength(1);
    expect(storeMessages[0].decryptedContent).toBe('Hello Bob');
  });
});
