import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { CustomerService, MilkSale } from '../../../core/services/customer.service';

@Component({
  selector: 'app-sold-milk',
  standalone: true,
  imports: [CommonModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="sold-milk-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Sold Milk Records</h1>
          <p class="page-description">Track all milk sales and customer transactions</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportSales()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export
          </button>
          <button class="btn-primary" (click)="addSale()">
            <app-feather-icon name="plus" size="16px"></app-feather-icon>
            Record Sale
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="shopping-cart" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalSales }}</div>
            <div class="stat-label">Total Sales</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="droplet" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalQuantity }}L</div>
            <div class="stat-label">Total Quantity</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="dollar-sign" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(stats.totalRevenue) }}</div>
            <div class="stat-label">Total Revenue</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <app-feather-icon name="trending-up" size="24px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(stats.averageOrderValue) }}</div>
            <div class="stat-label">Avg Order Value</div>
          </div>
        </div>
      </div>

      <!-- Sales Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>Milk Sales Records</h3>
            <span class="sales-count">{{ sales.length }} sales</span>
          </div>
          <div class="card-actions">
            <div class="search-box">
              <app-feather-icon name="search" size="16px"></app-feather-icon>
              <input 
                type="text" 
                placeholder="Search sales..." 
                [(ngModel)]="searchTerm"
                (input)="filterSales()"
                class="search-input">
            </div>
            <div class="filter-dropdown">
              <select [(ngModel)]="statusFilter" (change)="filterSales()" class="filter-select">
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div class="filter-dropdown">
              <select [(ngModel)]="customerFilter" (change)="filterSales()" class="filter-select">
                <option value="">All Customers</option>
                <option *ngFor="let customer of customers" [value]="customer.id">{{ customer.name }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredSales"
            [striped]="true"
            [hover]="true"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onSearch)="handleSearch($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
          </app-data-table>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./sold-milk.component.scss']
})
export class SoldMilkComponent implements OnInit {
  sales: MilkSale[] = [];
  filteredSales: MilkSale[] = [];
  customers: any[] = [];
  loading = false;
  searchTerm = '';
  statusFilter = '';
  customerFilter = '';
  stats: any = {};

  columns: any[] = [];

  constructor(private customerService: CustomerService) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadSales();
    this.loadCustomers();
    this.loadStats();
  }

  initializeColumns() {
    this.columns = [
      { key: 'customerName', title: 'Customer', type: 'text', sortable: true },
      { key: 'date', title: 'Date', type: 'date', sortable: true },
      { key: 'quantity', title: 'Quantity (L)', type: 'number', sortable: true },
      { key: 'pricePerLiter', title: 'Price/Liter', type: 'custom', sortable: true, template: this.priceTemplate },
      { key: 'totalAmount', title: 'Total Amount', type: 'custom', sortable: true, template: this.amountTemplate },
      { key: 'paymentMethod', title: 'Payment Method', type: 'custom', sortable: true, template: this.paymentMethodTemplate },
      { key: 'paymentStatus', title: 'Status', type: 'custom', sortable: true, template: this.statusTemplate },
      { key: 'deliveryMethod', title: 'Delivery', type: 'text', sortable: true },
      { key: 'actions', title: 'Actions', type: 'custom', template: this.actionsTemplate }
    ];
  }

  loadSales() {
    this.loading = true;
    
    // Simulate API call delay
    setTimeout(() => {
      this.sales = this.customerService.getMilkSales();
      this.filteredSales = [...this.sales];
      this.loading = false;
    }, 1000);
  }

  loadCustomers() {
    this.customers = this.customerService.getCustomers();
  }

  loadStats() {
    const sales = this.customerService.getMilkSales();
    this.stats = {
      totalSales: sales.length,
      totalQuantity: sales.reduce((sum, sale) => sum + sale.quantity, 0),
      totalRevenue: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      averageOrderValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.totalAmount, 0) / sales.length : 0
    };
  }

  filterSales() {
    this.filteredSales = this.sales.filter(sale => {
      const matchesSearch = !this.searchTerm || 
        sale.customerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        sale.paymentMethod.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || sale.paymentStatus === this.statusFilter;
      const matchesCustomer = !this.customerFilter || sale.customerId === this.customerFilter;
      
      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }

  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    // TODO: Implement sorting
    console.log('Sort:', event);
  }

  handleSearch(term: string) {
    this.searchTerm = term;
    this.filterSales();
  }

  handlePageChange(page: number) {
    // TODO: Implement pagination
    console.log('Page:', page);
  }

  handlePageSizeChange(size: number) {
    // TODO: Implement page size change
    console.log('Page size:', size);
  }

  addSale() {
    // TODO: Open add sale modal
    console.log('Add new sale');
  }

  exportSales() {
    // TODO: Implement export functionality
    console.log('Export sales');
  }

  viewSale(sale: MilkSale) {
    // TODO: View sale details
    console.log('View sale:', sale);
  }

  editSale(sale: MilkSale) {
    // TODO: Edit sale
    console.log('Edit sale:', sale);
  }

  deleteSale(sale: MilkSale) {
    if (confirm(`Are you sure you want to delete this sale record?`)) {
      this.customerService.deleteMilkSale(sale.id);
      this.loadSales();
      this.loadStats();
    }
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

  // Template functions
  priceTemplate = (sale: MilkSale) => `
    <div class="price">${this.formatCurrency(sale.pricePerLiter)}/L</div>
  `;

  amountTemplate = (sale: MilkSale) => `
    <div class="amount">${this.formatCurrency(sale.totalAmount)}</div>
  `;

  paymentMethodTemplate = (sale: MilkSale) => `
    <span class="payment-method ${sale.paymentMethod.toLowerCase().replace(' ', '-')}">${sale.paymentMethod}</span>
  `;

  statusTemplate = (sale: MilkSale) => `
    <span class="status-badge ${sale.paymentStatus.toLowerCase()}">${sale.paymentStatus}</span>
  `;

  actionsTemplate = (sale: MilkSale) => `
    <div class="action-buttons">
      <button class="btn-icon" title="View" (click)="viewSale(sale)">
        <app-feather-icon name="eye" size="16px"></app-feather-icon>
      </button>
      <button class="btn-icon" title="Edit" (click)="editSale(sale)">
        <app-feather-icon name="edit" size="16px"></app-feather-icon>
      </button>
      <button class="btn-icon danger" title="Delete" (click)="deleteSale(sale)">
        <app-feather-icon name="trash-2" size="16px"></app-feather-icon>
      </button>
    </div>
  `;
}
