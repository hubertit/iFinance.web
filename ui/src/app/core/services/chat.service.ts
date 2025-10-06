import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { CustomerService, Customer } from './customer.service';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'voice';
  status: 'sent' | 'delivered' | 'read';
  isOwn: boolean;
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
  };
}

export interface Chat {
  id: string;
  name: string;
  avatar?: string;
  type: 'individual' | 'group';
  lastMessage?: ChatMessage;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: Date;
  participants: ChatParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member';
  isOnline: boolean;
  lastSeen?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chats: Chat[] = [];
  private messages: ChatMessage[] = [];
  private currentChatId = new BehaviorSubject<string | null>(null);

  constructor(private customerService: CustomerService) {
    // Load initial chats
    this.loadChatsFromCustomers();
    
    // Listen for customer changes and reload chats
    // We'll call this method when customers are updated
  }

  // Chat methods
  getChats(): Observable<Chat[]> {
    return of(this.chats);
  }

  // Method to reload chats when customers are updated
  reloadChats() {
    this.loadChatsFromCustomers();
  }

  getChatById(id: string): Chat | undefined {
    return this.chats.find(chat => chat.id === id);
  }

  getCurrentChatId(): Observable<string | null> {
    return this.currentChatId.asObservable();
  }

  setCurrentChat(chatId: string | null) {
    this.currentChatId.next(chatId);
  }

  getCurrentChat(): Chat | undefined {
    const currentId = this.currentChatId.value;
    return currentId ? this.getChatById(currentId) : undefined;
  }

  // Message methods
  getMessages(chatId: string): Observable<ChatMessage[]> {
    const chatMessages = this.messages.filter(msg => msg.chatId === chatId);
    return of(chatMessages);
  }

  sendMessage(chatId: string, content: string, type: 'text' | 'image' | 'file' | 'voice' = 'text'): ChatMessage {
    const newMessage: ChatMessage = {
      id: this.generateId(),
      chatId,
      senderId: 'current-user',
      senderName: 'You',
      senderAvatar: 'assets/img/user.png',
      content,
      timestamp: new Date(),
      type,
      status: 'sent',
      isOwn: true
    };

    this.messages.push(newMessage);
    
    // Update chat's last message
    const chat = this.getChatById(chatId);
    if (chat) {
      chat.lastMessage = newMessage;
      chat.updatedAt = new Date();
    }

    // If it's a bot chat, generate a bot response
    if (chatId === 'bot-chat') {
      setTimeout(() => {
        this.generateBotResponse(chatId, content);
      }, 1500);
    }

    return newMessage;
  }

  markAsRead(chatId: string, messageId: string) {
    const message = this.messages.find(msg => msg.id === messageId && msg.chatId === chatId);
    if (message && !message.isOwn) {
      message.status = 'read';
    }
  }

  markChatAsRead(chatId: string) {
    const chat = this.getChatById(chatId);
    if (chat) {
      chat.unreadCount = 0;
    }
  }

  // Group chat methods
  createGroupChat(name: string, participants: ChatParticipant[]): Chat {
    const newChat: Chat = {
      id: this.generateId(),
      name,
      type: 'group',
      unreadCount: 0,
      isOnline: false,
      participants,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.chats.unshift(newChat);
    return newChat;
  }

  addParticipantToGroup(chatId: string, participant: ChatParticipant) {
    const chat = this.getChatById(chatId);
    if (chat && chat.type === 'group') {
      chat.participants.push(participant);
      chat.updatedAt = new Date();
    }
  }

  removeParticipantFromGroup(chatId: string, participantId: string) {
    const chat = this.getChatById(chatId);
    if (chat && chat.type === 'group') {
      chat.participants = chat.participants.filter(p => p.id !== participantId);
      chat.updatedAt = new Date();
    }
  }

  // Search methods
  searchChats(query: string): Observable<Chat[]> {
    const filteredChats = this.chats.filter(chat =>
      chat.name.toLowerCase().includes(query.toLowerCase()) ||
      chat.lastMessage?.content.toLowerCase().includes(query.toLowerCase())
    );
    return of(filteredChats);
  }

  searchMessages(chatId: string, query: string): Observable<ChatMessage[]> {
    const chatMessages = this.messages.filter(msg =>
      msg.chatId === chatId &&
      msg.content.toLowerCase().includes(query.toLowerCase())
    );
    return of(chatMessages);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private loadChatsFromCustomers() {
    // Get customers from the customer service
    const customers = this.customerService.getCustomers();
    
    // Create bot chat first
    const botChat: Chat = {
      id: 'bot-chat',
      name: 'Gemura Assistant',
      avatar: 'bot-icon', // Use icon instead of image
      type: 'individual' as const,
      unreadCount: 0,
      isOnline: true,
      lastSeen: new Date(),
      participants: [
        {
          id: 'bot',
          name: 'iFinance Assistant',
          avatar: 'bot-icon', // Use icon instead of image
          role: 'member' as const,
          isOnline: true,
          lastSeen: new Date()
        }
      ],
      lastMessage: {
        id: 'bot-welcome',
        chatId: 'bot-chat',
        senderId: 'bot',
        senderName: 'iFinance Assistant',
        content: 'Hello! I\'m here to help you with any questions about your milk business. How can I assist you today?',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        type: 'text',
        status: 'delivered',
        isOwn: false
      },
      createdAt: new Date(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 30)
    };

    // Convert customers to chats
    let customerChats: Chat[] = [];
    
    if (customers && customers.length > 0) {
      customerChats = customers.map((customer, index) => {
        const chatId = `chat-${customer.id}`;
        const isOnline = Math.random() > 0.5; // Random online status for demo
        const unreadCount = Math.floor(Math.random() * 5); // Random unread count
        
        return {
          id: chatId,
          name: customer.name,
          avatar: customer.avatar || 'assets/img/user.png',
          type: 'individual' as const,
          unreadCount,
          isOnline,
          lastSeen: isOnline ? new Date() : new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24),
          participants: [
            {
              id: customer.id,
              name: customer.name,
              avatar: customer.avatar || 'assets/img/user.png',
              role: 'member' as const,
              isOnline,
              lastSeen: isOnline ? new Date() : new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24)
            }
          ],
          lastMessage: this.generateRandomLastMessage(chatId, customer.name),
          createdAt: customer.registrationDate || new Date(),
          updatedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24)
        };
      });
    } else {
      // Create some mock customer chats if no customers are available
      customerChats = this.createMockCustomerChats();
    }

    // Put bot chat first, then customer chats
    this.chats = [botChat, ...customerChats];

    // Generate some sample messages for the first few chats
    this.generateSampleMessages();
  }

  private createMockCustomerChats(): Chat[] {
    const mockCustomers = [
      { id: 'mock-1', name: 'John Doe', avatar: 'assets/img/user.png' },
      { id: 'mock-2', name: 'Jane Smith', avatar: 'assets/img/user.png' },
      { id: 'mock-3', name: 'Mike Johnson', avatar: 'assets/img/user.png' }
    ];

    return mockCustomers.map(customer => {
      const chatId = `chat-${customer.id}`;
      const isOnline = Math.random() > 0.5;
      const unreadCount = Math.floor(Math.random() * 5);
      
      return {
        id: chatId,
        name: customer.name,
        avatar: customer.avatar,
        type: 'individual' as const,
        unreadCount,
        isOnline,
        lastSeen: isOnline ? new Date() : new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24),
        participants: [
          {
            id: customer.id,
            name: customer.name,
            avatar: customer.avatar,
            role: 'member' as const,
            isOnline,
            lastSeen: isOnline ? new Date() : new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24)
          }
        ],
        lastMessage: this.generateRandomLastMessage(chatId, customer.name),
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7), // Random date in past week
        updatedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24)
      };
    });
  }

  private generateRandomLastMessage(chatId: string, customerName: string): ChatMessage {
    const messages = [
      'Hello! How can I help you today?',
      'Thanks for your message!',
      'I\'ll get back to you soon.',
      'Is there anything else I can help with?',
      'Have a great day!',
      'Let me know if you need anything.',
      'Perfect! I\'ll take care of that.',
      'Thanks for reaching out!'
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const isOwn = Math.random() > 0.5;
    
    return {
      id: `msg-${chatId}-${Date.now()}`,
      chatId,
      senderId: isOwn ? 'current-user' : customerName.toLowerCase().replace(' ', '-'),
      senderName: isOwn ? 'You' : customerName,
      content: randomMessage,
      timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24),
      type: 'text',
      status: isOwn ? 'sent' : 'delivered',
      isOwn
    };
  }

  private generateSampleMessages() {
    // Generate some sample messages for the first few chats
    const sampleMessages: ChatMessage[] = [];
    
    // Add initial bot messages for the bot chat
    const botChat = this.chats.find(chat => chat.id === 'bot-chat');
    if (botChat) {
      const botMessages = [
        {
          id: 'bot-welcome',
          chatId: 'bot-chat',
          senderId: 'bot',
          senderName: 'iFinance Assistant',
          senderAvatar: 'bot-icon',
          content: 'Hello! I\'m here to help you with any questions about your milk business. How can I assist you today?',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          type: 'text' as const,
          status: 'delivered' as const,
          isOwn: false
        },
        {
          id: 'bot-tip-1',
          chatId: 'bot-chat',
          senderId: 'bot',
          senderName: 'iFinance Assistant',
          senderAvatar: 'bot-icon',
          content: '💡 Tip: You can ask me about customers, sales, inventory, or any aspect of your milk business!',
          timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
          type: 'text' as const,
          status: 'delivered' as const,
          isOwn: false
        }
      ];
      sampleMessages.push(...botMessages);
    }
    
    // Generate messages for customer chats
    this.chats.slice(1, 4).forEach(chat => {
      const messageCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < messageCount; i++) {
        const isOwn = Math.random() > 0.5;
        const messages = [
          'Hello! How are you?',
          'Thanks for your message!',
          'I\'ll get back to you soon.',
          'Is there anything else I can help with?',
          'Have a great day!',
          'Let me know if you need anything.',
          'Perfect! I\'ll take care of that.',
          'Thanks for reaching out!'
        ];
        
        sampleMessages.push({
          id: `msg-${chat.id}-${i}`,
          chatId: chat.id,
          senderId: isOwn ? 'current-user' : chat.participants[0].id,
          senderName: isOwn ? 'You' : chat.participants[0].name,
          senderAvatar: isOwn ? 'assets/img/user.png' : chat.participants[0].avatar,
          content: messages[Math.floor(Math.random() * messages.length)],
          timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24),
          type: 'text',
          status: isOwn ? 'sent' : 'delivered',
          isOwn
        });
      }
    });
    
    this.messages = sampleMessages;
  }

  private generateBotResponse(chatId: string, userMessage: string): void {
    const botResponses = this.getBotResponses(userMessage);
    const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];

    const botMessage: ChatMessage = {
      id: this.generateId(),
      chatId,
      senderId: 'bot',
      senderName: 'iFinance Assistant',
      senderAvatar: 'bot-icon',
      content: randomResponse,
      timestamp: new Date(),
      type: 'text',
      status: 'delivered',
      isOwn: false
    };

    // Add bot message to the list
    this.messages.push(botMessage);

    // Update chat's last message
    const chat = this.getChatById(chatId);
    if (chat) {
      chat.lastMessage = botMessage;
      chat.updatedAt = new Date();
    }
  }

  private getBotResponses(userMessage: string): string[] {
    const message = userMessage.toLowerCase();

    // Business-related responses
    if (message.includes('customer') || message.includes('client')) {
      return [
        'I can help you manage your customers. You can view all customers, add new ones, or track their purchase history.',
        'Your customer database is accessible from the Customers section. Would you like me to show you how to add a new customer?',
        'Customer management is essential for your business. I can guide you through the process of adding or updating customer information.'
      ];
    }

    if (message.includes('milk') || message.includes('supply') || message.includes('delivery')) {
      return [
        'I can help you track milk supplies and deliveries. You can monitor inventory levels and schedule deliveries to your customers.',
        'Managing milk supply is crucial for your business. I can assist you with inventory tracking and delivery scheduling.',
        'Your milk business requires careful supply management. I can help you optimize your delivery routes and track customer orders.'
      ];
    }

    if (message.includes('sales') || message.includes('revenue') || message.includes('profit')) {
      return [
        'I can help you analyze your sales data and revenue. You can view detailed reports and track your business performance.',
        'Sales analytics are important for business growth. I can help you understand your revenue patterns and customer behavior.',
        'Tracking sales and revenue helps you make informed decisions. I can assist you with financial reporting and analysis.'
      ];
    }

    if (message.includes('help') || message.includes('support')) {
      return [
        'I\'m here to help you with your milk business! I can assist with customer management, sales tracking, inventory, and more.',
        'I can guide you through various aspects of your business including customer relations, supply management, and financial tracking.',
        'Feel free to ask me about any aspect of your milk business. I\'m here to help you succeed!'
      ];
    }

    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return [
        'Hello! I\'m your iFinance Assistant. How can I help you with your financial needs today?',
        'Hi there! I\'m here to assist you with managing your milk business. What would you like to know?',
        'Greetings! I\'m ready to help you with any questions about your business operations.'
      ];
    }

    // Default responses
    return [
      'I understand you\'re asking about that. Let me help you with information about your milk business.',
      'That\'s a great question! I can help you find the information you need about your business operations.',
      'I\'m here to assist you with your milk business. Could you be more specific about what you\'d like to know?',
      'I can help you with various aspects of your business including customers, sales, inventory, and more. What specific area interests you?'
    ];
  }
}
