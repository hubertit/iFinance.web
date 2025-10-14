import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';

export interface CreateWalletData {
  name: string;
  type: 'individual' | 'joint';
  isSaving: boolean;
  description?: string;
  targetAmount?: number;
  targetDate?: Date;
  owners?: WalletMember[];
  isDefault?: boolean;
  rules?: WalletRule[];
}

export interface WalletMember {
  name: string;
  phone: string;
}

export interface WalletRule {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

@Component({
  selector: 'app-create-wallet-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FeatherIconComponent],
  template: `
    <div class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Create New Ikofi</h3>
          <button class="close-btn" (click)="onClose()">
            <app-feather-icon name="x" size="20px"></app-feather-icon>
          </button>
        </div>
        
        <form class="modal-content" (ngSubmit)="onSubmit()" #walletForm="ngForm">
          <!-- Wallet Name -->
          <div class="form-group">
            <label for="walletName">Ikofi Name *</label>
            <input
              type="text"
              id="walletName"
              name="name"
              [(ngModel)]="walletData.name"
              #nameInput="ngModel"
              required
              placeholder="Enter Ikofi name"
              class="form-control"
            />
            <div class="error-message" *ngIf="nameInput.invalid && nameInput.touched">
              Ikofi name is required
            </div>
          </div>

          <!-- Wallet Type -->
          <div class="form-group">
            <label>Ikofi Type *</label>
            <div class="type-options">
              <label class="type-option" [class.selected]="walletData.type === 'individual'">
                <input
                  type="radio"
                  name="type"
                  value="individual"
                  [(ngModel)]="walletData.type"
                  required
                />
                <div class="option-content">
                  <app-feather-icon name="user" size="20px"></app-feather-icon>
                  <div class="option-text">
                    <span class="option-title">Individual</span>
                    <span class="option-description">Personal Ikofi for your own use</span>
                  </div>
                </div>
              </label>
              
              <label class="type-option" [class.selected]="walletData.type === 'joint'">
                <input
                  type="radio"
                  name="type"
                  value="joint"
                  [(ngModel)]="walletData.type"
                  required
                />
                <div class="option-content">
                  <app-feather-icon name="users" size="20px"></app-feather-icon>
                  <div class="option-text">
                    <span class="option-title">Joint</span>
                    <span class="option-description">Shared Ikofi with family or friends</span>
                  </div>
                </div>
              </label>

            </div>
          </div>

          <!-- Saving Toggle -->
          <div class="form-group">
            <label class="toggle-label">
              <input
                type="checkbox"
                [(ngModel)]="walletData.isSaving"
                name="isSaving"
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              <div class="toggle-content">
                <div class="toggle-title">
                  <app-feather-icon name="save" size="16px"></app-feather-icon>
                  <span>Make this a Saving Ikofi</span>
                </div>
                <div class="toggle-description">
                  Enable savings features with goals and targets
                </div>
              </div>
            </label>
          </div>

          <!-- Joint Wallet Members (only for joint wallets) -->
          <div class="form-group" *ngIf="walletData.type === 'joint'">
            <label for="owners">Joint Wallet Members</label>
            <div class="members-list">
              <div class="member-item" *ngFor="let member of walletData.owners; let i = index">
                <div class="member-info">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-phone">{{ member.phone }}</div>
                </div>
                <button type="button" class="remove-member" (click)="removeOwner(i)">
                  <app-feather-icon name="x" size="12px"></app-feather-icon>
                </button>
              </div>
            </div>
            
            <div class="add-member-form">
              <div class="member-inputs">
                <div class="input-group">
                  <label for="memberName">Member Name</label>
                  <input
                    type="text"
                    id="memberName"
                    [(ngModel)]="newMember.name"
                    placeholder="Enter member name"
                    class="form-control"
                  />
                </div>
                <div class="input-group">
                  <label for="memberPhone">Phone Number</label>
                  <input
                    type="tel"
                    id="memberPhone"
                    [(ngModel)]="newMember.phone"
                    placeholder="Enter phone number"
                    class="form-control"
                  />
                </div>
              </div>
              <button type="button" class="add-member-btn" (click)="addOwner()" [disabled]="!newMember.name || !newMember.phone">
                <app-feather-icon name="plus" size="16px"></app-feather-icon>
                Add Member
              </button>
            </div>
            
            <div class="members-help">
              <app-feather-icon name="info" size="14px"></app-feather-icon>
              <span>Add up to 5 members to your joint Ikofi. All members will have access to the wallet.</span>
            </div>
          </div>

          <!-- Description -->
          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              name="description"
              [(ngModel)]="walletData.description"
              placeholder="Optional description for your Ikofi"
              class="form-control"
              rows="3"
            ></textarea>
          </div>

          <!-- Target Amount (only for saving wallets) -->
          <div class="form-group" *ngIf="walletData.isSaving">
            <label for="targetAmount">Target Amount (RWF)</label>
            <input
              type="number"
              id="targetAmount"
              name="targetAmount"
              [(ngModel)]="walletData.targetAmount"
              placeholder="Enter target amount"
              class="form-control"
              min="0"
            />
          </div>

          <!-- Target Date (only for saving wallets with target amount) -->
          <div class="form-group" *ngIf="walletData.isSaving && walletData.targetAmount">
            <label for="targetDate">Target Date</label>
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              [(ngModel)]="targetDateString"
              class="form-control"
            />
          </div>

          <!-- Wallet Rules (only for joint wallets) -->
          <div class="form-group" *ngIf="walletData.type === 'joint' && jointWalletRules.length > 0">
            <label>Joint Ikofi Rules & Guidelines</label>
            <div class="rules-container">
              <div class="rule-item" *ngFor="let rule of jointWalletRules">
                <div class="rule-header">
                  <app-feather-icon 
                    [name]="rule.required ? 'alert-circle' : 'info'" 
                    size="16px"
                    [class.required]="rule.required">
                  </app-feather-icon>
                  <span class="rule-title">{{ rule.title }}</span>
                  <span class="rule-badge" *ngIf="rule.required">Required</span>
                </div>
                <p class="rule-description">{{ rule.description }}</p>
              </div>
            </div>
          </div>

          <!-- Validation Summary -->
          <div class="validation-summary" *ngIf="validationErrors.length > 0">
            <div class="validation-header">
              <app-feather-icon name="alert-triangle" size="16px"></app-feather-icon>
              <span>Please fix the following issues:</span>
            </div>
            <ul class="validation-errors">
              <li *ngFor="let error of validationErrors">{{ error }}</li>
            </ul>
          </div>

          <!-- Modal Actions -->
          <div class="modal-actions">
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="!walletForm.valid || isSubmitting"
            >
              <app-feather-icon name="plus" size="16px" *ngIf="!isSubmitting"></app-feather-icon>
              <app-feather-icon name="loader" size="16px" *ngIf="isSubmitting"></app-feather-icon>
              {{ isSubmitting ? 'Creating...' : 'Create Ikofi' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./create-wallet-modal.component.scss']
})
export class CreateWalletModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() walletCreated = new EventEmitter<CreateWalletData>();

  walletData: CreateWalletData = {
    name: '',
    type: 'individual',
    isSaving: false,
    description: '',
    targetAmount: undefined,
    targetDate: undefined,
    owners: [],
    isDefault: false,
    rules: []
  };

  newMember: WalletMember = { name: '', phone: '' };
  isSubmitting = false;
  validationErrors: string[] = [];
  walletRules: WalletRule[] = [];
  jointWalletRules: WalletRule[] = [];

  get targetDateString(): string {
    return this.walletData.targetDate ? this.walletData.targetDate.toISOString().split('T')[0] : '';
  }

  set targetDateString(value: string) {
    this.walletData.targetDate = value ? new Date(value) : undefined;
  }

  ngOnInit() {
    this.initializeWalletRules();
  }

  initializeWalletRules() {
    // General wallet rules
    this.walletRules = [
      {
        id: 'name-required',
        title: 'Ikofi Name Required',
        description: 'Each Ikofi must have a unique name to identify it.',
        required: true
      },
      {
        id: 'type-selection',
        title: 'Type Selection Required',
        description: 'Choose between Individual or Joint Ikofi based on your needs.',
        required: true
      },
      {
        id: 'saving-toggle',
        title: 'Saving Features',
        description: 'Any Ikofi can be a saving Ikofi. Enable this to add savings goals and targets.',
        required: false
      },
      {
        id: 'currency-rwf',
        title: 'Currency: RWF Only',
        description: 'All Ikofis use Rwandan Franc (RWF) as the default currency.',
        required: true
      },
      {
        id: 'balance-start',
        title: 'Starting Balance',
        description: 'New Ikofis start with 0 RWF balance. You can add money after creation.',
        required: true
      }
    ];

    // Joint wallet specific rules
    this.jointWalletRules = [
      {
        id: 'joint-owners',
        title: 'Joint Ikofi Members Required',
        description: 'Joint Ikofis require at least one additional member. You can add up to 5 members.',
        required: true
      },
      {
        id: 'joint-access',
        title: 'Shared Access',
        description: 'All members will have equal access to the joint Ikofi and can view transactions.',
        required: true
      },
      {
        id: 'joint-permissions',
        title: 'Member Permissions',
        description: 'All members can deposit, withdraw, and view the joint Ikofi balance.',
        required: true
      },
      {
        id: 'joint-notifications',
        title: 'Transaction Notifications',
        description: 'All members will receive notifications for joint Ikofi transactions.',
        required: false
      }
    ];
  }

  onClose() {
    this.close.emit();
  }

  addOwner() {
    if (this.newMember.name.trim() && this.newMember.phone.trim()) {
      this.walletData.owners = this.walletData.owners || [];
      this.walletData.owners.push({
        name: this.newMember.name.trim(),
        phone: this.newMember.phone.trim()
      });
      this.newMember = { name: '', phone: '' };
    }
  }

  removeOwner(index: number) {
    this.walletData.owners?.splice(index, 1);
  }

  validateWalletData(): boolean {
    this.validationErrors = [];

    // Name validation
    if (!this.walletData.name || this.walletData.name.trim().length < 3) {
      this.validationErrors.push('Ikofi name must be at least 3 characters long.');
    }

    // Type validation
    if (!this.walletData.type) {
      this.validationErrors.push('Please select an Ikofi type.');
    }

    // Joint wallet validation
    if (this.walletData.type === 'joint') {
      if (!this.walletData.owners || this.walletData.owners.length === 0) {
        this.validationErrors.push('Joint Ikofis require at least one additional member.');
      }
      if (this.walletData.owners && this.walletData.owners.length > 5) {
        this.validationErrors.push('Joint Ikofis can have maximum 5 members.');
      }
      // Validate member data
      if (this.walletData.owners) {
        for (let i = 0; i < this.walletData.owners.length; i++) {
          const member = this.walletData.owners[i];
          if (!member.name.trim()) {
            this.validationErrors.push(`Member ${i + 1} name is required.`);
          }
          if (!member.phone.trim()) {
            this.validationErrors.push(`Member ${i + 1} phone number is required.`);
          }
        }
      }
    }

    // Saving wallet validation
    if (this.walletData.isSaving) {
      if (this.walletData.targetAmount && this.walletData.targetAmount <= 0) {
        this.validationErrors.push('Target amount must be greater than 0.');
      }
      if (this.walletData.targetAmount && !this.walletData.targetDate) {
        this.validationErrors.push('Saving Ikofis with target amounts should have a target date.');
      }
      if (this.walletData.targetDate && this.walletData.targetDate <= new Date()) {
        this.validationErrors.push('Target date must be in the future.');
      }
    }

    // Target amount validation
    if (this.walletData.targetAmount && this.walletData.targetAmount < 0) {
      this.validationErrors.push('Target amount cannot be negative.');
    }

    // Target date validation
    if (this.walletData.targetDate && this.walletData.targetDate <= new Date()) {
      this.validationErrors.push('Target date must be in the future.');
    }

    return this.validationErrors.length === 0;
  }

  onSubmit() {
    if (this.isSubmitting) return;
    
    // Validate data
    if (!this.validateWalletData()) {
      return;
    }
    
    this.isSubmitting = true;
    
    // Simulate API call
    setTimeout(() => {
      this.walletCreated.emit(this.walletData);
      this.isSubmitting = false;
    }, 1000);
  }
}