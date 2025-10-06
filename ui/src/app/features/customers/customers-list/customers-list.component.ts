import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { AddCustomerModalComponent } from '../../../shared/components/add-customer-modal/add-customer-modal.component';
import { ViewCustomerModalComponent } from '../../../shared/components/view-customer-modal/view-customer-modal.component';
import { EditCustomerModalComponent } from '../../../shared/components/edit-customer-modal/edit-customer-modal.component';
import { DeleteCustomerModalComponent } from '../../../shared/components/delete-customer-modal/delete-customer-modal.component';
import { CustomerService, Customer } from '../../../core/services/customer.service';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent, AddCustomerModalComponent, ViewCustomerModalComponent, EditCustomerModalComponent, DeleteCustomerModalComponent],
  template: `
    <div class="customers-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Customers</h1>
          <p class="page-description">Manage your customer database and track sales</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="openAddCustomerModal()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Add Customer
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="users" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalCustomers }}</div>
            <div class="stat-label">Total Customers</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="user-check" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.activeCustomers }}</div>
            <div class="stat-label">Active Customers</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="dollar-sign" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(stats.averagePrice) }}</div>
            <div class="stat-label">Avg Price/Liter</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="trending-up" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(stats.totalRevenue) }}</div>
            <div class="stat-label">Total Revenue</div>
          </div>
        </div>
      </div>


      <!-- Customers Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>All Customers</h3>
            <span class="customer-count">{{ customers.length }} customers</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredCustomers"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="customers.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-customer>
              <div class="dropdown" [class.show]="openDropdownId === customer.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(customer.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === customer.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewCustomer(customer)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="editCustomer(customer)">
                      <app-feather-icon name="edit" size="14px" class="me-2"></app-feather-icon>
                      Edit
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="deleteCustomer(customer)">
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

      <!-- Add Customer Modal -->
      <app-add-customer-modal 
        *ngIf="showAddCustomerModal"
        (customerAdded)="onCustomerAdded($event)"
        (modalClosed)="closeAddCustomerModal()">
      </app-add-customer-modal>

      <!-- View Customer Modal -->
      <app-view-customer-modal 
        *ngIf="showViewCustomerModal && selectedCustomer"
        [customer]="selectedCustomer"
        (modalClosed)="onViewModalClosed()"
        (editRequested)="onEditRequested($event)">
      </app-view-customer-modal>

      <!-- Edit Customer Modal -->
      <app-edit-customer-modal 
        *ngIf="showEditCustomerModal && selectedCustomer"
        [customer]="selectedCustomer"
        (customerUpdated)="onCustomerUpdated($event)"
        (modalClosed)="onEditModalClosed()">
      </app-edit-customer-modal>

      <!-- Delete Customer Modal -->
      <app-delete-customer-modal 
        *ngIf="showDeleteCustomerModal && selectedCustomer"
        [customer]="selectedCustomer"
        (customerDeleted)="onCustomerDeleted($event)"
        (modalClosed)="onDeleteModalClosed()">
      </app-delete-customer-modal>
    </div>
  `,
  styleUrls: ['./customers-list.component.scss']
})
export class CustomersListComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  stats: any = {};
  loading = false;
  showAddCustomerModal = false;
  showViewCustomerModal = false;
  showEditCustomerModal = false;
  showDeleteCustomerModal = false;
  selectedCustomer: Customer | null = null;

  columns: any[] = [];
  
  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  
  // Dropdown state
  openDropdownId: string | null = null;

  constructor(private customerService: CustomerService) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadCustomers();
    this.loadStats();
    
    // Reload customers from API if token is available
    this.customerService.reloadCustomers();
    
    // Load customers from API after a short delay to ensure service is ready
    setTimeout(() => {
      this.customerService.getCustomersFromAPI().subscribe({
        next: (response) => {
          console.log('✅ API Load Successful:', response);
          this.loadCustomers();
          this.loadStats();
        },
        error: (error) => {
          console.error('❌ API Load Failed:', error);
          console.log('Using mock data instead');
        }
      });
    }, 100);

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.closeDropdown();
    });
  }

  initializeColumns() {
    this.columns = [
      { key: 'index', title: 'No.', type: 'number', sortable: false },
      { key: 'name', title: 'Customer', type: 'text', sortable: true },
      { key: 'phone', title: 'Phone', type: 'text', sortable: true },
      { key: 'address', title: 'Address', type: 'text', sortable: true },
      { key: 'pricePerLiter', title: 'Price/Liter (RWF)', type: 'number', sortable: true },
      { key: 'averageSupplyQuantity', title: 'Avg Supply (L)', type: 'number', sortable: true },
      { key: 'status', title: 'Status', type: 'status', sortable: true },
      { key: 'registrationDate', title: 'Registered', type: 'date', sortable: true }
    ];
  }

  loadCustomers() {
    this.loading = true;
    
    // Simulate API call delay
    setTimeout(() => {
      this.customers = this.customerService.getCustomers();
      // Add index to each customer for the No. column
      this.customers = this.customers.map((customer, index) => ({
        ...customer,
        index: index + 1
      }));
      this.filteredCustomers = [...this.customers];
      this.loading = false;
    }, 1000);
  }

  loadStats() {
    const customers = this.customerService.getCustomers();
    this.stats = {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'Active').length,
      totalRevenue: customers.reduce((sum, c) => sum + (c.totalAmount || 0), 0),
      averagePrice: customers.length > 0 ? customers.reduce((sum, c) => sum + (c.pricePerLiter || 0), 0) / customers.length : 0
    };
  }

  filterCustomers() {
    this.filteredCustomers = [...this.customers];
    // Re-index filtered customers
    this.filteredCustomers = this.filteredCustomers.map((customer, index) => ({
      ...customer,
      index: index + 1
    }));
  }

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


  viewCustomer(customer: Customer) {
    this.closeDropdown();
    this.selectedCustomer = customer;
    this.showViewCustomerModal = true;
  }

  editCustomer(customer: Customer) {
    this.closeDropdown();
    this.selectedCustomer = customer;
    this.showEditCustomerModal = true;
  }

  deleteCustomer(customer: Customer) {
    this.closeDropdown();
    this.selectedCustomer = customer;
    this.showDeleteCustomerModal = true;
  }

  toggleDropdown(customerId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === customerId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = customerId;
    }
  }

  closeDropdown() {
    this.openDropdownId = null;
  }

  // Modal event handlers
  onViewModalClosed() {
    this.showViewCustomerModal = false;
    this.selectedCustomer = null;
  }

  onEditModalClosed() {
    this.showEditCustomerModal = false;
    this.selectedCustomer = null;
  }

  onDeleteModalClosed() {
    this.showDeleteCustomerModal = false;
    this.selectedCustomer = null;
  }

  onEditRequested(customer: Customer) {
    this.showViewCustomerModal = false;
    this.selectedCustomer = customer;
    this.showEditCustomerModal = true;
  }

  onCustomerUpdated(updatedCustomer: any) {
    // Update customer in the list
    const index = this.customers.findIndex(c => c.id === updatedCustomer.id);
    if (index !== -1) {
      this.customers[index] = { ...this.customers[index], ...updatedCustomer };
      this.loadCustomers();
      this.loadStats();
    }
  }

  onCustomerDeleted(customer: Customer) {
    // Remove customer from the list
    this.customerService.deleteCustomer(customer.id);
    this.loadCustomers();
    this.loadStats();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }


  // Modal methods
  openAddCustomerModal() {
    this.showAddCustomerModal = true;
  }

  closeAddCustomerModal() {
    this.showAddCustomerModal = false;
  }

  onCustomerAdded(customerData: any) {
    // Call API to create customer
    this.customerService.addCustomer({
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email,
      address: customerData.address,
      pricePerLiter: customerData.pricePerLiter
    }).subscribe({
      next: (response) => {
        console.log('Customer created successfully:', response);
        // Reload customers from API
        this.loadCustomers();
        this.loadStats();
      },
      error: (error) => {
        console.error('Failed to create customer:', error);
        // You might want to show an error message to the user
      }
    });
  }


}
