import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, LoanProduct } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-loan-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="loan-products">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Loan Products</h1>
          <p class="page-description">Manage your loan products and offerings</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="openCreateProductModal()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Create Product
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon active">
            <app-feather-icon name="package" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.activeProducts }}</div>
            <div class="stat-label">Active Products</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon total">
            <app-feather-icon name="layers" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalProducts }}</div>
            <div class="stat-label">Total Products</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon applications">
            <app-feather-icon name="file-text" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalApplications }}</div>
            <div class="stat-label">Total Applications</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon amount">
            <app-feather-icon name="dollar-sign" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(stats.totalAmount) }}</div>
            <div class="stat-label">Total Disbursed</div>
          </div>
        </div>
      </div>

      <!-- Products Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Loan Products</h3>
            <span class="product-count">{{ products.length }} products</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="products"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="products.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-product>
              <div class="dropdown" [class.show]="openDropdownId === product.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(product.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === product.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewProduct(product)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Details
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="editProduct(product)">
                      <app-feather-icon name="edit" size="14px" class="me-2"></app-feather-icon>
                      Edit Product
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="toggleProductStatus(product)">
                      <app-feather-icon [name]="product.isActive ? 'pause' : 'play'" size="14px" class="me-2"></app-feather-icon>
                      {{ product.isActive ? 'Deactivate' : 'Activate' }}
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="deleteProduct(product)">
                      <app-feather-icon name="trash-2" size="14px" class="me-2"></app-feather-icon>
                      Delete
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </app-data-table>
        </div>
      </div>

      <!-- Create/Edit Product Modal -->
      <div class="modal-overlay" *ngIf="showProductModal" (click)="closeProductModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Edit Product' : 'Create New Product' }}</h3>
            <button class="close-btn" (click)="closeProductModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          
          <form class="modal-content" (ngSubmit)="saveProduct()" #productForm="ngForm">
            <div class="form-grid">
              <div class="form-group">
                <label for="productName">Product Name *</label>
                <input
                  type="text"
                  id="productName"
                  name="name"
                  [(ngModel)]="productData.name"
                  #nameInput="ngModel"
                  required
                  placeholder="Enter product name"
                  class="form-control"
                />
                <div class="error-message" *ngIf="nameInput.invalid && nameInput.touched">
                  Product name is required
                </div>
              </div>

              <div class="form-group">
                <label for="interestRate">Interest Rate (%) *</label>
                <input
                  type="number"
                  id="interestRate"
                  name="interestRate"
                  [(ngModel)]="productData.interestRate"
                  #interestInput="ngModel"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Enter interest rate"
                  class="form-control"
                />
                <div class="error-message" *ngIf="interestInput.invalid && interestInput.touched">
                  Interest rate is required and must be between 0-100
                </div>
              </div>

              <div class="form-group">
                <label for="minAmount">Minimum Amount (RWF) *</label>
                <input
                  type="number"
                  id="minAmount"
                  name="minAmount"
                  [(ngModel)]="productData.minAmount"
                  #minAmountInput="ngModel"
                  required
                  min="0"
                  placeholder="Enter minimum amount"
                  class="form-control"
                />
                <div class="error-message" *ngIf="minAmountInput.invalid && minAmountInput.touched">
                  Minimum amount is required
                </div>
              </div>

              <div class="form-group">
                <label for="maxAmount">Maximum Amount (RWF) *</label>
                <input
                  type="number"
                  id="maxAmount"
                  name="maxAmount"
                  [(ngModel)]="productData.maxAmount"
                  #maxAmountInput="ngModel"
                  required
                  min="0"
                  placeholder="Enter maximum amount"
                  class="form-control"
                />
                <div class="error-message" *ngIf="maxAmountInput.invalid && maxAmountInput.touched">
                  Maximum amount is required
                </div>
              </div>

              <div class="form-group">
                <label for="termMonths">Term (Months) *</label>
                <input
                  type="number"
                  id="termMonths"
                  name="termMonths"
                  [(ngModel)]="productData.termMonths"
                  #termInput="ngModel"
                  required
                  min="1"
                  placeholder="Enter term in months"
                  class="form-control"
                />
                <div class="error-message" *ngIf="termInput.invalid && termInput.touched">
                  Term is required and must be at least 1 month
                </div>
              </div>

              <div class="form-group">
                <label for="loanType">Loan Type *</label>
                <select id="loanType" name="loanType" [(ngModel)]="productData.loanType" required class="form-control">
                  <option value="cash">Cash Loan</option>
                  <option value="asset">Asset Loan</option>
                </select>
              </div>

              <div class="form-group">
                <label for="isActive">Status</label>
                <select id="isActive" name="isActive" [(ngModel)]="productData.isActive" class="form-control">
                  <option [value]="true">Active</option>
                  <option [value]="false">Inactive</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="description">Description *</label>
              <textarea
                id="description"
                name="description"
                [(ngModel)]="productData.description"
                #descriptionInput="ngModel"
                required
                placeholder="Enter product description"
                class="form-control"
                rows="3"
              ></textarea>
              <div class="error-message" *ngIf="descriptionInput.invalid && descriptionInput.touched">
                Description is required
              </div>
            </div>

            <div class="form-group">
              <label for="requirements">General Requirements (one per line)</label>
              <textarea
                id="requirements"
                name="requirements"
                [(ngModel)]="requirementsText"
                placeholder="Enter general requirements, one per line"
                class="form-control"
                rows="4"
              ></textarea>
            </div>

            <div class="form-group" *ngIf="productData.loanType === 'asset'">
              <label for="assetRequirements">Asset-Specific Requirements (one per line)</label>
              <textarea
                id="assetRequirements"
                name="assetRequirements"
                [(ngModel)]="assetRequirementsText"
                placeholder="Enter asset-specific requirements (e.g., asset ownership documents, valuation report, insurance certificate)"
                class="form-control"
                rows="4"
              ></textarea>
              <small class="form-text text-muted">These requirements are specific to asset-backed loans</small>
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
                [disabled]="!productForm.valid || isSubmitting"
              >
                <app-feather-icon name="save" size="16px" *ngIf="!isSubmitting"></app-feather-icon>
                <app-feather-icon name="loader" size="16px" *ngIf="isSubmitting"></app-feather-icon>
                {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product') }}
              </button>
              <button type="button" class="btn btn-secondary" (click)="closeProductModal()">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./loan-products.component.scss']
})
export class LoanProductsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  products: LoanProduct[] = [];
  loading = false;
  showProductModal = false;
  isEditing = false;
  isSubmitting = false;
  validationErrors: string[] = [];
  
  // Product form data
  productData: Partial<LoanProduct> = {
    name: '',
    description: '',
    loanType: 'cash',
    minAmount: 0,
    maxAmount: 0,
    interestRate: 0,
    termMonths: 0,
    requirements: [],
    assetRequirements: [],
    isActive: true
  };
  
  requirementsText = '';
  assetRequirementsText = '';
  
  // Table
  columns: any[] = [];
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  openDropdownId: string | null = null;
  
  // Stats
  stats = {
    activeProducts: 0,
    totalProducts: 0,
    totalApplications: 0,
    totalAmount: 0
  };

  constructor(private lenderService: LenderService) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadProducts();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns() {
    this.columns = [
      { key: 'name', title: 'Product Name', type: 'text', sortable: true },
      { key: 'loanType', title: 'Loan Type', type: 'text', sortable: true },
      { key: 'description', title: 'Description', type: 'text', sortable: false },
      { key: 'minAmount', title: 'Min Amount', type: 'currency', sortable: true },
      { key: 'maxAmount', title: 'Max Amount', type: 'currency', sortable: true },
      { key: 'interestRate', title: 'Interest Rate', type: 'percentage', sortable: true },
      { key: 'termMonths', title: 'Term (Months)', type: 'number', sortable: true },
      { key: 'isActive', title: 'Status', type: 'status', sortable: true },
      { key: 'createdAt', title: 'Created', type: 'date', sortable: true }
    ];
  }

  private loadProducts() {
    this.loading = true;
    
    this.lenderService.loanProducts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(products => {
        this.products = products;
        this.calculateStats();
        this.loading = false;
      });
  }

  private setupEventListeners() {
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.closeDropdown();
    });
  }

  private calculateStats() {
    this.stats = {
      activeProducts: this.products.filter(p => p.isActive).length,
      totalProducts: this.products.length,
      totalApplications: 0, // TODO: Calculate from applications
      totalAmount: 0 // TODO: Calculate from disbursed loans
    };
  }

  // Modal methods
  openCreateProductModal() {
    this.isEditing = false;
    this.resetProductData();
    this.showProductModal = true;
  }

  closeProductModal() {
    this.showProductModal = false;
    this.isEditing = false;
    this.resetProductData();
    this.validationErrors = [];
  }

  private resetProductData() {
    this.productData = {
      name: '',
      description: '',
      loanType: 'cash',
      minAmount: 0,
      maxAmount: 0,
      interestRate: 0,
      termMonths: 0,
      requirements: [],
      assetRequirements: [],
      isActive: true
    };
    this.requirementsText = '';
    this.assetRequirementsText = '';
  }

  // Product actions
  viewProduct(product: LoanProduct) {
    this.closeDropdown();
    // TODO: Show product details modal
    console.log('View product:', product);
  }

  editProduct(product: LoanProduct) {
    this.closeDropdown();
    this.isEditing = true;
    this.productData = { ...product };
    this.requirementsText = product.requirements.join('\n');
    this.assetRequirementsText = product.assetRequirements?.join('\n') || '';
    this.showProductModal = true;
  }

  toggleProductStatus(product: LoanProduct) {
    this.lenderService.updateLoanProduct(product.id, { isActive: !product.isActive });
    this.closeDropdown();
    this.loadProducts();
  }

  deleteProduct(product: LoanProduct) {
    if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      // TODO: Implement delete functionality
      this.closeDropdown();
      console.log('Delete product:', product);
    }
  }

  saveProduct() {
    if (this.isSubmitting) return;
    
    // Validate data
    if (!this.validateProductData()) {
      return;
    }
    
    this.isSubmitting = true;
    
    // Prepare product data
    const productToSave = {
      ...this.productData,
      requirements: this.requirementsText.split('\n').filter(req => req.trim()),
      assetRequirements: this.productData.loanType === 'asset' 
        ? this.assetRequirementsText.split('\n').filter(req => req.trim())
        : undefined
    };
    
    if (this.isEditing) {
      // Update existing product
      this.lenderService.updateLoanProduct(this.productData.id!, productToSave);
    } else {
      // Create new product
      this.lenderService.addLoanProduct(productToSave as Omit<LoanProduct, 'id' | 'createdAt'>);
    }
    
    // Simulate API call
    setTimeout(() => {
      this.isSubmitting = false;
      this.closeProductModal();
      this.loadProducts();
    }, 1000);
  }

  private validateProductData(): boolean {
    this.validationErrors = [];

    // Name validation
    if (!this.productData.name || this.productData.name.trim().length < 3) {
      this.validationErrors.push('Product name must be at least 3 characters long.');
    }

    // Description validation
    if (!this.productData.description || this.productData.description.trim().length < 10) {
      this.validationErrors.push('Description must be at least 10 characters long.');
    }

    // Amount validation
    if (!this.productData.minAmount || this.productData.minAmount <= 0) {
      this.validationErrors.push('Minimum amount must be greater than 0.');
    }

    if (!this.productData.maxAmount || this.productData.maxAmount <= 0) {
      this.validationErrors.push('Maximum amount must be greater than 0.');
    }

    if (this.productData.minAmount && this.productData.maxAmount && 
        this.productData.minAmount >= this.productData.maxAmount) {
      this.validationErrors.push('Maximum amount must be greater than minimum amount.');
    }

    // Interest rate validation
    if (!this.productData.interestRate || this.productData.interestRate <= 0 || this.productData.interestRate > 100) {
      this.validationErrors.push('Interest rate must be between 0 and 100.');
    }

    // Term validation
    if (!this.productData.termMonths || this.productData.termMonths <= 0) {
      this.validationErrors.push('Term must be at least 1 month.');
    }

    return this.validationErrors.length === 0;
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    // TODO: Implement sorting
    console.log('Sort:', event);
  }

  handlePageChange(page: number) {
    this.currentPage = page;
  }

  handlePageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  // Dropdown handlers
  toggleDropdown(productId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === productId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = productId;
    }
  }

  closeDropdown() {
    this.openDropdownId = null;
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return this.lenderService.formatCurrency(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }
}
