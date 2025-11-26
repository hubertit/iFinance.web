import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatherIconComponent } from '../feather-icon/feather-icon.component';
import { WalletService, Wallet } from '../../../core/services/wallet.service';

interface BillCategory {
  id: string;
  name: string;
  icon: string;
  providers: string[];
}

@Component({
  selector: 'app-pay-bills-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FeatherIconComponent],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Pay Bills</h3>
          <button class="close-btn" (click)="close()">
            <app-feather-icon name="x" size="20px"></app-feather-icon>
          </button>
        </div>

        <div class="modal-body">
          <!-- Category Selection -->
          <div class="categories-grid" *ngIf="!selectedCategory">
            <button 
              class="category-btn" 
              *ngFor="let category of categories"
              (click)="selectCategory(category)">
              <div class="category-icon">
                <app-feather-icon [name]="category.icon" size="20px"></app-feather-icon>
              </div>
              <span>{{ category.name }}</span>
            </button>
          </div>

          <!-- Bill Payment Form -->
          <form [formGroup]="billForm" (ngSubmit)="onSubmit()" *ngIf="selectedCategory">
            <div class="selected-category">
              <button class="back-btn" type="button" (click)="selectedCategory = null">
                <app-feather-icon name="arrow-left" size="16px"></app-feather-icon>
              </button>
              <div class="category-icon small">
                <app-feather-icon [name]="selectedCategory.icon" size="16px"></app-feather-icon>
              </div>
              <span>{{ selectedCategory.name }}</span>
            </div>

            <!-- From Wallet -->
            <div class="form-group">
              <label>From Wallet</label>
              <select formControlName="walletId" class="form-control">
                <option value="">Select wallet</option>
                <option *ngFor="let wallet of wallets" [value]="wallet.id">
                  {{ wallet.name }} ({{ formatCurrency(wallet.balance) }})
                </option>
              </select>
            </div>

            <!-- Provider -->
            <div class="form-group">
              <label>Provider</label>
              <select formControlName="provider" class="form-control">
                <option value="">Select provider</option>
                <option *ngFor="let provider of selectedCategory.providers" [value]="provider">
                  {{ provider }}
                </option>
              </select>
              <div class="error-message" *ngIf="billForm.get('provider')?.touched && billForm.get('provider')?.errors?.['required']">
                Please select a provider
              </div>
            </div>

            <!-- Account/Meter Number -->
            <div class="form-group">
              <label>{{ getAccountLabel() }}</label>
              <div class="input-with-icon">
                <app-feather-icon name="hash" size="16px"></app-feather-icon>
                <input 
                  type="text" 
                  formControlName="accountNumber" 
                  [placeholder]="getAccountPlaceholder()"
                  class="form-control">
              </div>
              <div class="error-message" *ngIf="billForm.get('accountNumber')?.touched && billForm.get('accountNumber')?.errors?.['required']">
                {{ getAccountLabel() }} is required
              </div>
            </div>

            <!-- Amount -->
            <div class="form-group">
              <label>Amount</label>
              <div class="input-with-icon">
                <app-feather-icon name="dollar-sign" size="16px"></app-feather-icon>
                <input 
                  type="number" 
                  formControlName="amount" 
                  placeholder="Enter amount"
                  class="form-control">
              </div>
              <div class="error-message" *ngIf="billForm.get('amount')?.touched && billForm.get('amount')?.errors?.['required']">
                Amount is required
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="close()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="isLoading || billForm.invalid">
                <span *ngIf="isLoading">Processing...</span>
                <span *ngIf="!isLoading">Pay Bill</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./pay-bills-modal.component.scss']
})
export class PayBillsModalComponent implements OnInit {
  @Output() modalClosed = new EventEmitter<void>();
  @Output() billPaid = new EventEmitter<any>();

  billForm: FormGroup;
  wallets: Wallet[] = [];
  isLoading = false;
  selectedCategory: BillCategory | null = null;

  categories: BillCategory[] = [
    {
      id: 'electricity',
      name: 'Electricity',
      icon: 'zap',
      providers: ['REG (Rwanda Energy Group)', 'EUCL']
    },
    {
      id: 'water',
      name: 'Water',
      icon: 'droplet',
      providers: ['WASAC']
    },
    {
      id: 'tv',
      name: 'TV & Internet',
      icon: 'tv',
      providers: ['StarTimes', 'Canal+', 'DStv', 'MTN Internet', 'Airtel Internet']
    },
    {
      id: 'airtime',
      name: 'Airtime',
      icon: 'smartphone',
      providers: ['MTN Rwanda', 'Airtel Rwanda']
    },
    {
      id: 'insurance',
      name: 'Insurance',
      icon: 'shield',
      providers: ['RSSB', 'Radiant Insurance', 'Soras', 'Prime Insurance']
    },
    {
      id: 'school',
      name: 'School Fees',
      icon: 'book',
      providers: ['Enter School Name']
    }
  ];

  constructor(
    private fb: FormBuilder,
    private walletService: WalletService
  ) {
    this.billForm = this.fb.group({
      walletId: ['', Validators.required],
      provider: ['', Validators.required],
      accountNumber: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.loadWallets();
  }

  loadWallets() {
    this.walletService.wallets$.subscribe(wallets => {
      this.wallets = wallets;
      if (wallets.length > 0) {
        const defaultWallet = wallets.find(w => w.isDefault) || wallets[0];
        this.billForm.patchValue({ walletId: defaultWallet.id });
      }
    });
  }

  selectCategory(category: BillCategory) {
    this.selectedCategory = category;
    this.billForm.patchValue({ provider: '', accountNumber: '', amount: '' });
  }

  getAccountLabel(): string {
    if (!this.selectedCategory) return 'Account Number';
    
    switch (this.selectedCategory.id) {
      case 'electricity': return 'Meter Number';
      case 'water': return 'Meter Number';
      case 'tv': return 'Smart Card / Account Number';
      case 'airtime': return 'Phone Number';
      case 'insurance': return 'Policy Number';
      case 'school': return 'Student ID';
      default: return 'Account Number';
    }
  }

  getAccountPlaceholder(): string {
    if (!this.selectedCategory) return 'Enter account number';
    
    switch (this.selectedCategory.id) {
      case 'electricity': return 'Enter meter number';
      case 'water': return 'Enter meter number';
      case 'tv': return 'Enter smart card number';
      case 'airtime': return 'e.g., 0788123456';
      case 'insurance': return 'Enter policy number';
      case 'school': return 'Enter student ID';
      default: return 'Enter account number';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  onSubmit() {
    if (this.billForm.invalid) return;

    this.isLoading = true;

    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.billPaid.emit({
        ...this.billForm.value,
        category: this.selectedCategory?.id
      });
      this.close();
    }, 1500);
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  close() {
    this.modalClosed.emit();
  }
}

