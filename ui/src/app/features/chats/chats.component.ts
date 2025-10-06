import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FeatherIconComponent } from '../../shared/components/feather-icon/feather-icon.component';
import { ChatService, Chat, ChatMessage } from '../../core/services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FeatherIconComponent],
  template: `
    <div class="chats-container">
      <!-- Header -->
      <div class="chats-header">
        <div class="header-content">
          <h1>Chats</h1>
          <p class="page-description">Stay connected with your team and customers</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="startNewChat()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            New Chat
          </button>
        </div>
      </div>


      <!-- Chat List -->
      <div class="chat-list" *ngIf="!currentChat">
        <div class="chat-item" 
             *ngFor="let chat of chats" 
             (click)="selectChat(chat)"
             [class.active]="currentChatId === chat.id">
          <div class="chat-avatar">
            <div class="avatar-content" *ngIf="chat.avatar === 'bot-icon'; else userAvatar">
              <app-feather-icon name="bot" size="24px"></app-feather-icon>
            </div>
            <ng-template #userAvatar>
              <img [src]="chat.avatar || 'assets/img/user.png'" [alt]="chat.name">
            </ng-template>
            <div class="online-indicator" *ngIf="chat.isOnline"></div>
          </div>
          <div class="chat-content">
            <div class="chat-header">
              <h3 class="chat-name">{{ chat.name }}</h3>
              <span class="chat-time">{{ formatTime(chat.lastMessage?.timestamp) }}</span>
            </div>
            <div class="chat-preview">
              <p class="last-message">{{ chat.lastMessage?.content || 'No messages yet' }}</p>
              <div class="chat-badges">
                <span class="unread-count" *ngIf="chat.unreadCount > 0">{{ chat.unreadCount }}</span>
                <app-feather-icon 
                  name="check" 
                  size="12px" 
                  *ngIf="chat.lastMessage?.isOwn"
                  [class.read]="chat.lastMessage?.status === 'read'">
                </app-feather-icon>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- Chat View -->
      <div class="chat-view" *ngIf="currentChat">
        <!-- Chat Header -->
        <div class="chat-header-bar">
          <button class="back-btn" (click)="closeChat()">
            <app-feather-icon name="arrow-left" size="20px"></app-feather-icon>
          </button>
          <div class="chat-info">
            <div class="chat-avatar-small">
              <div class="avatar-content" *ngIf="currentChat.avatar === 'bot-icon'; else userAvatarSmall">
                <app-feather-icon name="bot" size="20px"></app-feather-icon>
              </div>
              <ng-template #userAvatarSmall>
                <img [src]="currentChat.avatar || 'assets/img/user.png'" [alt]="currentChat.name">
              </ng-template>
              <div class="online-indicator" *ngIf="currentChat.isOnline"></div>
            </div>
            <div class="chat-details">
              <h3>{{ currentChat.name }}</h3>
              <p *ngIf="currentChat.type === 'individual'">
                {{ currentChat.isOnline ? 'Online' : 'Last seen ' + formatLastSeen(currentChat.lastSeen) }}
              </p>
              <p *ngIf="currentChat.type === 'group'">
                {{ currentChat.participants.length }} members
              </p>
            </div>
          </div>
          <div class="chat-actions">
            <button class="action-btn">
              <app-feather-icon name="phone" size="18px"></app-feather-icon>
            </button>
            <button class="action-btn">
              <app-feather-icon name="video" size="18px"></app-feather-icon>
            </button>
            <button class="action-btn">
              <app-feather-icon name="more-vertical" size="18px"></app-feather-icon>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div class="messages-container" #messagesContainer>
          <div class="message" 
               *ngFor="let message of messages" 
               [class.own-message]="message.isOwn"
               [class.reply-message]="message.replyTo">
            <div class="message-avatar" *ngIf="!message.isOwn">
              <img [src]="message.senderAvatar || 'assets/img/user.png'" [alt]="message.senderName">
            </div>
            <div class="message-content">
              <div class="message-header" *ngIf="!message.isOwn">
                <span class="sender-name">{{ message.senderName }}</span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="message-bubble" [class.reply-bubble]="message.replyTo">
                <div class="reply-preview" *ngIf="message.replyTo">
                  <div class="reply-content">
                    <span class="reply-sender">{{ message.replyTo.senderName }}</span>
                    <p class="reply-text">{{ message.replyTo.content }}</p>
                  </div>
                </div>
                <div class="message-text">{{ message.content }}</div>
                <div class="message-status" *ngIf="message.isOwn">
                  <app-feather-icon 
                    name="check" 
                    size="12px"
                    [class.read]="message.status === 'read'">
                  </app-feather-icon>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Message Input -->
        <div class="message-input">
          <button class="attach-btn">
            <app-feather-icon name="paperclip" size="20px"></app-feather-icon>
          </button>
          <div class="input-container">
            <input 
              type="text" 
              placeholder="Type a message..." 
              [(ngModel)]="newMessage"
              (keydown.enter)="sendMessage()"
              class="message-field">
          </div>
          <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim()">
            <app-feather-icon name="send" size="18px"></app-feather-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./chats.component.scss']
})
export class ChatsComponent implements OnInit, OnDestroy {
  chats: Chat[] = [];
  currentChat: Chat | null = null;
  currentChatId: string | null = null;
  messages: ChatMessage[] = [];
  newMessage = '';

  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.loadChats();
    this.subscribeToCurrentChat();
    
    // Reload chats after a short delay to ensure customers are loaded
    setTimeout(() => {
      this.chatService.reloadChats();
      this.loadChats();
    }, 1000);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadChats() {
    this.chatService.getChats().subscribe(chats => {
      this.chats = chats;
    });
  }

  subscribeToCurrentChat() {
    const sub = this.chatService.getCurrentChatId().subscribe(chatId => {
      this.currentChatId = chatId;
      if (chatId) {
        this.currentChat = this.chatService.getChatById(chatId) || null;
        this.loadMessages(chatId);
      } else {
        this.currentChat = null;
        this.messages = [];
      }
    });
    this.subscriptions.push(sub);
  }

  loadMessages(chatId: string) {
    this.chatService.getMessages(chatId).subscribe(messages => {
      this.messages = messages;
      // Mark chat as read
      this.chatService.markChatAsRead(chatId);
    });
  }

  selectChat(chat: Chat) {
    this.chatService.setCurrentChat(chat.id);
  }

  closeChat() {
    this.chatService.setCurrentChat(null);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.currentChatId) return;

    this.chatService.sendMessage(this.currentChatId, this.newMessage.trim());
    this.newMessage = '';
    
    // Reload messages to show the new one
    this.loadMessages(this.currentChatId);
  }


  startNewChat() {
    // TODO: Implement new chat modal
    console.log('Start new chat');
  }

  formatTime(date?: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString();
  }

  formatLastSeen(date?: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  }
}
