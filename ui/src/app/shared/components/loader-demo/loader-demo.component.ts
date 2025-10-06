import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn } from '../data-table/data-table.component';

@Component({
  selector: 'app-loader-demo',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <div class="demo-container">
      <h2>Enhanced Table Loader Demo</h2>
      <p>This demonstrates the new enhanced loading state with skeleton rows and modern animations.</p>
      
      <div class="demo-controls">
        <button class="btn btn-primary" (click)="toggleLoading()">
          {{ isLoading ? 'Stop Loading' : 'Start Loading' }}
        </button>
        <button class="btn btn-secondary" (click)="loadData()" [disabled]="isLoading">
          Load Data
        </button>
      </div>

      <div class="demo-table">
        <app-data-table
          [columns]="columns"
          [data]="data"
          [loading]="isLoading"
          [showActions]="true"
          [showPagination]="true">
        </app-data-table>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .demo-controls {
      margin: 1rem 0;
      display: flex;
      gap: 1rem;
    }

    .demo-table {
      margin-top: 2rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background-color: #004AAD;
      color: white;
    }

    .btn-primary:hover {
      background-color: #003d8a;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class LoaderDemoComponent implements OnInit {
  isLoading = false;
  data: any[] = [];
  
  columns: TableColumn[] = [
    { key: 'id', title: 'ID', type: 'text', sortable: true },
    { key: 'name', title: 'Name', type: 'text', sortable: true },
    { key: 'email', title: 'Email', type: 'text', sortable: true },
    { key: 'status', title: 'Status', type: 'status', sortable: true },
    { key: 'createdAt', title: 'Created', type: 'date', sortable: true }
  ];

  ngOnInit() {
    // Initial empty state
  }

  toggleLoading() {
    this.isLoading = !this.isLoading;
  }

  loadData() {
    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      this.data = [
        { id: 1, name: 'John Doe', email: 'john@example.com', status: 'ACTIVE', createdAt: new Date() },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'PENDING', createdAt: new Date() },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'ACTIVE', createdAt: new Date() },
        { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'INACTIVE', createdAt: new Date() },
        { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', status: 'ACTIVE', createdAt: new Date() }
      ];
      this.isLoading = false;
    }, 3000); // 3 second delay to see the loader
  }
}
