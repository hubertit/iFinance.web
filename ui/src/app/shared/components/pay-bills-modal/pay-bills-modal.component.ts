import { Component, EventEmitter, Output, Input, OnInit, OnChanges } from '@angular/core';
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
    <!-- Modal -->
    <div class="modal fade" [class.show]="isVisible" [style.display]="isVisible ? 'block' : 'none'" 
         tabindex="-1" role="dialog" [attr.aria-hidden]="!isVisible">
      <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
          <!-- Modal Header -->
          <div class="modal-header">
            <h5 class="modal-title">Pay Bills</h5>
            <button type="button" class="btn-close-custom" (click)="onClose()" aria-label="Close">
              <app-feather-icon name="x" size="18px"></app-feather-icon>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <!-- Category Selection -->
            <div class="categories-grid" *ngIf="!selectedCategory">
              <button 
                type="button"
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
            <form [formGroup]="billForm" (ngSubmit)="onSubmit()" *ngIf="selectedCategory" novalidate>
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
              <div class="mb-3">
                <label for="walletId" class="form-label required">
                  <app-feather-icon name="credit-card" size="16px" class="me-1"></app-feather-icon>
                  From Wallet
                </label>
                <select 
                  id="walletId"
                  formControlName="walletId" 
                  class="form-select"
                  [class.is-invalid]="billForm.get('walletId')?.touched && billForm.get('walletId')?.invalid">
                  <option value="">Select wallet</option>
                  <option *ngFor="let wallet of wallets" [value]="wallet.id">
                    {{ wallet.name }} ({{ formatCurrency(wallet.balance) }})
                  </option>
                </select>
              </div>

              <!-- Provider -->
              <div class="mb-3">
                <label for="provider" class="form-label required">
                  <app-feather-icon name="briefcase" size="16px" class="me-1"></app-feather-icon>
                  Provider
                </label>
                <select 
                  id="provider"
                  formControlName="provider" 
                  class="form-select"
                  [class.is-invalid]="billForm.get('provider')?.touched && billForm.get('provider')?.invalid">
                  <option value="">Select provider</option>
                  <option *ngFor="let provider of selectedCategory.providers" [value]="provider">
                    {{ provider }}
                  </option>
                </select>
                <div *ngIf="billForm.get('provider')?.touched && billForm.get('provider')?.errors?.['required']" class="invalid-feedback">
                  Please select a provider
                </div>
              </div>

              <!-- Account/Meter Number -->
              <div class="mb-3">
                <label for="accountNumber" class="form-label required">
                  <app-feather-icon name="hash" size="16px" class="me-1"></app-feather-icon>
                  {{ getAccountLabel() }}
                </label>
                <input 
                  type="text"
                  id="accountNumber" 
                  formControlName="accountNumber" 
                  [placeholder]="getAccountPlaceholder()"
                  class="form-control"
                  [class.is-invalid]="billForm.get('accountNumber')?.touched && billForm.get('accountNumber')?.invalid">
                <div *ngIf="billForm.get('accountNumber')?.touched && billForm.get('accountNumber')?.errors?.['required']" class="invalid-feedback">
                  {{ getAccountLabel() }} is required
                </div>
              </div>

              <!-- Amount -->
              <div class="mb-3">
                <label for="amount" class="form-label required">
                  <app-feather-icon name="dollar-sign" size="16px" class="me-1"></app-feather-icon>
                  Amount
                </label>
                <input 
                  type="number"
                  id="amount" 
                  formControlName="amount" 
                  placeholder="Enter amount"
                  class="form-control"
                  [class.is-invalid]="billForm.get('amount')?.touched && billForm.get('amount')?.invalid">
                <div *ngIf="billForm.get('amount')?.touched && billForm.get('amount')?.errors?.['required']" class="invalid-feedback">
                  Amount is required
                </div>
              </div>
            </form>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer" *ngIf="selectedCategory">
            <button type="button" class="btn btn-outline-danger" (click)="onClose()" [disabled]="isLoading">
              <app-feather-icon name="x" size="16px" class="me-1"></app-feather-icon>
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              (click)="onSubmit()"
              [disabled]="isLoading || billForm.invalid">
              <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-1" role="status"></span>
              {{ isLoading ? 'Processing...' : 'Pay Bill' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div class="modal-backdrop fade" [class.show]="isVisible" *ngIf="isVisible" (click)="onBackdropClick()"></div>
  `,
  styleUrls: ['./pay-bills-modal.component.scss']
})
export class PayBillsModalComponent implements OnInit, OnChanges {
  @Input() isVisible = false;
  @Input() isLoading = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  billForm: FormGroup;
  wallets: Wallet[] = [];
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

  ngOnChanges() {
    if (this.isVisible) {
      this.resetForm();
    }
  }

  private resetForm() {
    this.billForm.reset();
    this.selectedCategory = null;
    if (this.wallets.length > 0) {
      const defaultWallet = this.wallets.find(w => w.isDefault) || this.wallets[0];
      this.billForm.patchValue({ walletId: defaultWallet.id });
    }
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
    this.save.emit({
      ...this.billForm.value,
      category: this.selectedCategory?.id
    });
  }

  onBackdropClick() {
    if (!this.isLoading) {
      this.onClose();
    }
  }

  onClose() {
    this.close.emit();
  }
}
