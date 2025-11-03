import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatherIconComponent } from '../../../shared/components/feather-icon/feather-icon.component';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { LenderService, LoanApplication } from '../../../core/services/lender.service';
import { Subject, takeUntil } from 'rxjs';

export interface KYCVerification {
  id: string;
  applicationId: string;
  borrowerId: string;
  borrowerName: string;
  borrowerPhone: string;
  documents: Array<{
    id: string;
    type: string;
    name: string;
    uploadedAt: Date;
    status: 'pending' | 'verified' | 'rejected';
    verifiedBy?: string;
    verifiedAt?: Date;
    rejectionReason?: string;
  }>;
  verificationStatus: 'pending' | 'in_progress' | 'verified' | 'rejected' | 'expired';
  submittedAt: Date;
  verifiedAt?: Date;
  expiresAt?: Date;
  overallScore?: number;
}

@Component({
  selector: 'app-kyc-verification',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FeatherIconComponent, DataTableComponent],
  template: `
    <div class="kyc-verification">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>KYC Verification</h1>
          <p class="page-description">Review and verify borrower identity and documentation</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="exportReport()">
            <app-feather-icon name="download" size="16px"></app-feather-icon>
            Export Report
          </button>
          <button class="btn-primary" (click)="refreshVerifications()">
            <app-feather-icon name="refresh-cw" size="16px"></app-feather-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Verification Stats -->
      <div class="stats-grid" *ngIf="verificationStats">
        <div class="stat-card">
          <div class="stat-icon pending">
            <app-feather-icon name="clock" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ verificationStats.pending }}</div>
            <div class="stat-label">Pending Review</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon in-progress">
            <app-feather-icon name="loader" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ verificationStats.inProgress }}</div>
            <div class="stat-label">In Progress</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon verified">
            <app-feather-icon name="check-circle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ verificationStats.verified }}</div>
            <div class="stat-label">Verified</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon rejected">
            <app-feather-icon name="x-circle" size="20px"></app-feather-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ verificationStats.rejected }}</div>
            <div class="stat-label">Rejected</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-grid">
          <div class="filter-group">
            <label for="statusFilter">Verification Status</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="filterVerifications()">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="searchInput">Search</label>
            <input 
              type="text" 
              id="searchInput" 
              [(ngModel)]="searchTerm" 
              (input)="filterVerifications()"
              placeholder="Search by borrower name or phone..."
            />
          </div>
        </div>
      </div>

      <!-- Verifications Table -->
      <div class="card">
        <div class="card-header">
          <div class="card-title-section">
            <h3>KYC Verifications</h3>
            <span class="verification-count">{{ filteredVerifications.length }} verifications</span>
          </div>
        </div>
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [data]="filteredVerifications"
            [striped]="true"
            [hover]="true"
            [showActions]="true"
            [showPagination]="true"
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalPages]="totalPages"
            [totalItems]="filteredVerifications.length"
            [loading]="loading"
            (onSort)="handleSort($event)"
            (onPageChange)="handlePageChange($event)"
            (onPageSizeChange)="handlePageSizeChange($event)">
            
            <ng-template #rowActions let-verification>
              <div class="dropdown" [class.show]="openDropdownId === verification.id">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                        (click)="toggleDropdown(verification.id, $event)">
                  <app-feather-icon name="more-horizontal" size="16px"></app-feather-icon>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" [class.show]="openDropdownId === verification.id">
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="viewVerification(verification)">
                      <app-feather-icon name="eye" size="14px" class="me-2"></app-feather-icon>
                      View Details
                    </a>
                  </li>
                  <li *ngIf="verification.verificationStatus === 'pending'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="startVerification(verification)">
                      <app-feather-icon name="play" size="14px" class="me-2"></app-feather-icon>
                      Start Verification
                    </a>
                  </li>
                  <li *ngIf="verification.verificationStatus === 'in_progress'">
                    <a class="dropdown-item" href="javascript:void(0)" (click)="completeVerification(verification)">
                      <app-feather-icon name="check" size="14px" class="me-2"></app-feather-icon>
                      Complete Verification
                    </a>
                  </li>
                  <li *ngIf="verification.verificationStatus === 'in_progress'">
                    <a class="dropdown-item text-danger" href="javascript:void(0)" (click)="rejectVerification(verification)">
                      <app-feather-icon name="x" size="14px" class="me-2"></app-feather-icon>
                      Reject
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="javascript:void(0)" (click)="downloadDocuments(verification)">
                      <app-feather-icon name="download" size="14px" class="me-2"></app-feather-icon>
                      Download Documents
                    </a>
                  </li>
                </ul>
              </div>
            </ng-template>
          </app-data-table>
        </div>
      </div>

      <!-- Verification Details Modal -->
      <div class="modal-overlay" *ngIf="showVerificationModal" (click)="closeVerificationModal()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>KYC Verification Details</h3>
            <button class="close-btn" (click)="closeVerificationModal()">
              <app-feather-icon name="x" size="20px"></app-feather-icon>
            </button>
          </div>
          
          <div class="modal-content" *ngIf="selectedVerification">
            <div class="verification-info">
              <div class="info-section">
                <h4>Borrower Information</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Name:</label>
                    <span>{{ selectedVerification.borrowerName }}</span>
                  </div>
                  <div class="info-item">
                    <label>Phone:</label>
                    <span>{{ selectedVerification.borrowerPhone }}</span>
                  </div>
                  <div class="info-item">
                    <label>Status:</label>
                    <span class="status-badge" [class]="selectedVerification.verificationStatus">
                      {{ formatStatus(selectedVerification.verificationStatus) }}
                    </span>
                  </div>
                  <div class="info-item">
                    <label>Submitted:</label>
                    <span>{{ formatDate(selectedVerification.submittedAt) }}</span>
                  </div>
                  <div class="info-item" *ngIf="selectedVerification.verifiedAt">
                    <label>Verified:</label>
                    <span>{{ formatDate(selectedVerification.verifiedAt) }}</span>
                  </div>
                  <div class="info-item" *ngIf="selectedVerification.expiresAt">
                    <label>Expires:</label>
                    <span>{{ formatDate(selectedVerification.expiresAt) }}</span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h4>Documents</h4>
                <div class="documents-list">
                  <div class="document-item" *ngFor="let doc of selectedVerification.documents">
                    <div class="document-info">
                      <div class="document-name">
                        <app-feather-icon name="file" size="16px"></app-feather-icon>
                        <span>{{ doc.name }}</span>
                        <span class="document-type">({{ doc.type }})</span>
                      </div>
                      <div class="document-meta">
                        <span class="document-date">Uploaded: {{ formatDate(doc.uploadedAt) }}</span>
                        <span class="document-status" [class]="doc.status">
                          {{ formatStatus(doc.status) }}
                        </span>
                      </div>
                      <div class="document-actions">
                        <button class="btn-small" (click)="viewDocument(doc)">
                          <app-feather-icon name="eye" size="14px"></app-feather-icon>
                          View
                        </button>
                        <button class="btn-small" (click)="downloadDocument(doc)">
                          <app-feather-icon name="download" size="14px"></app-feather-icon>
                          Download
                        </button>
                        <button 
                          class="btn-small" 
                          *ngIf="doc.status === 'pending' && selectedVerification.verificationStatus === 'in_progress'"
                          (click)="verifyDocument(doc)">
                          <app-feather-icon name="check" size="14px"></app-feather-icon>
                          Verify
                        </button>
                        <button 
                          class="btn-small text-danger" 
                          *ngIf="doc.status === 'pending' && selectedVerification.verificationStatus === 'in_progress'"
                          (click)="rejectDocument(doc)">
                          <app-feather-icon name="x" size="14px"></app-feather-icon>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="info-section" *ngIf="selectedVerification.overallScore">
                <h4>Verification Score</h4>
                <div class="score-display">
                  <div class="score-value" [class]="getScoreClass(selectedVerification.overallScore)">
                    {{ selectedVerification.overallScore }}%
                  </div>
                  <div class="score-label">{{ getScoreLabel(selectedVerification.overallScore) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./kyc-verification.component.scss']
})
export class KYCVerificationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  verifications: KYCVerification[] = [];
  filteredVerifications: KYCVerification[] = [];
  selectedVerification: KYCVerification | null = null;
  showVerificationModal = false;
  
  // Filters
  selectedStatus = '';
  searchTerm = '';
  
  // Stats
  verificationStats: {
    pending: number;
    inProgress: number;
    verified: number;
    rejected: number;
  } | null = null;
  
  // Table
  columns: any[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  openDropdownId: string | null = null;

  constructor(private lenderService: LenderService) {}

  ngOnInit() {
    this.initializeColumns();
    this.loadVerifications();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeColumns() {
    this.columns = [
      { key: 'borrowerName', title: 'Borrower', type: 'text', sortable: true },
      { key: 'borrowerPhone', title: 'Phone', type: 'text', sortable: true },
      { key: 'documents', title: 'Documents', type: 'text', sortable: false },
      { key: 'verificationStatus', title: 'Status', type: 'status', sortable: true },
      { key: 'submittedAt', title: 'Submitted', type: 'date', sortable: true },
      { key: 'verifiedAt', title: 'Verified', type: 'date', sortable: true }
    ];
  }

  private loadVerifications() {
    this.loading = true;

    this.lenderService.loanApplications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(applications => {
        this.verifications = applications.map(app => this.createKYCVerification(app));
        this.calculateStats();
        this.filterVerifications();
        this.loading = false;
      });
  }

  private createKYCVerification(application: LoanApplication): KYCVerification {
    const docTypes = ['National ID', 'Proof of Address', 'Income Statement', 'Bank Statement'];
    const statuses: Array<'pending' | 'verified' | 'rejected'> = ['pending', 'verified', 'rejected'];
    
    const documents = application.documents.map((docName, index) => ({
      id: `DOC-${application.id}-${index}`,
      type: docTypes[index % docTypes.length],
      name: docName,
      uploadedAt: application.submittedAt,
      status: statuses[Math.floor(Math.random() * statuses.length)] as 'pending' | 'verified' | 'rejected',
      verifiedBy: Math.random() > 0.5 ? 'John Doe' : undefined,
      verifiedAt: Math.random() > 0.5 ? new Date(application.submittedAt.getTime() + 24 * 60 * 60 * 1000) : undefined
    }));

    let verificationStatus: 'pending' | 'in_progress' | 'verified' | 'rejected' | 'expired' = 'pending';
    if (documents.every(d => d.status === 'verified')) {
      verificationStatus = 'verified';
    } else if (documents.some(d => d.status === 'verified')) {
      verificationStatus = 'in_progress';
    } else if (documents.some(d => d.status === 'rejected')) {
      verificationStatus = 'rejected';
    }

    const verifiedCount = documents.filter(d => d.status === 'verified').length;
    const overallScore = (verifiedCount / documents.length) * 100;

    return {
      id: `KYC-${application.id}`,
      applicationId: application.id,
      borrowerId: application.applicantId,
      borrowerName: application.applicantName,
      borrowerPhone: application.applicantPhone,
      documents: documents,
      verificationStatus: verificationStatus,
      submittedAt: application.submittedAt,
      verifiedAt: verificationStatus === 'verified' ? new Date(application.submittedAt.getTime() + 48 * 60 * 60 * 1000) : undefined,
      expiresAt: new Date(application.submittedAt.getTime() + 365 * 24 * 60 * 60 * 1000),
      overallScore: overallScore
    };
  }

  private calculateStats() {
    this.verificationStats = {
      pending: this.verifications.filter(v => v.verificationStatus === 'pending').length,
      inProgress: this.verifications.filter(v => v.verificationStatus === 'in_progress').length,
      verified: this.verifications.filter(v => v.verificationStatus === 'verified').length,
      rejected: this.verifications.filter(v => v.verificationStatus === 'rejected').length
    };
  }

  filterVerifications() {
    let filtered = [...this.verifications];

    if (this.selectedStatus) {
      filtered = filtered.filter(v => v.verificationStatus === this.selectedStatus);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.borrowerName.toLowerCase().includes(term) ||
        v.borrowerPhone.includes(term)
      );
    }

    this.filteredVerifications = filtered;
    this.totalPages = Math.ceil(this.filteredVerifications.length / this.pageSize);
  }

  refreshVerifications() {
    this.loadVerifications();
  }

  exportReport() {
    console.log('Export KYC verification report');
    alert('Export functionality will be implemented');
  }

  // Table event handlers
  handleSort(event: { column: string; direction: 'asc' | 'desc' }) {
    const { column, direction } = event;
    
    this.filteredVerifications.sort((a, b) => {
      let aValue: any = (a as any)[column];
      let bValue: any = (b as any)[column];
      
      if (column.includes('At') || column.includes('Date')) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }
      
      if (typeof aValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  handlePageChange(page: number) {
    this.currentPage = page;
  }

  handlePageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  // Dropdown handlers
  toggleDropdown(verificationId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId === verificationId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = verificationId;
    }
  }

  closeDropdown() {
    this.openDropdownId = null;
  }

  private setupEventListeners() {
    document.addEventListener('click', () => {
      this.closeDropdown();
    });
  }

  // Action methods
  viewVerification(verification: KYCVerification) {
    this.closeDropdown();
    this.selectedVerification = verification;
    this.showVerificationModal = true;
  }

  startVerification(verification: KYCVerification) {
    this.closeDropdown();
    // TODO: Implement start verification
    console.log('Start verification:', verification.id);
    alert(`Starting verification for ${verification.borrowerName}`);
  }

  completeVerification(verification: KYCVerification) {
    this.closeDropdown();
    if (confirm(`Complete KYC verification for ${verification.borrowerName}?`)) {
      // TODO: Implement complete verification
      console.log('Complete verification:', verification.id);
      alert('Verification completed');
    }
  }

  rejectVerification(verification: KYCVerification) {
    this.closeDropdown();
    const reason = prompt('Please provide rejection reason:');
    if (reason) {
      // TODO: Implement reject verification
      console.log('Reject verification:', verification.id, reason);
      alert('Verification rejected');
    }
  }

  downloadDocuments(verification: KYCVerification) {
    this.closeDropdown();
    console.log('Download documents for:', verification.id);
    alert(`Downloading all documents for ${verification.borrowerName}...`);
  }

  viewDocument(doc: any) {
    console.log('View document:', doc.id);
    alert(`Viewing document: ${doc.name}`);
  }

  downloadDocument(doc: any) {
    console.log('Download document:', doc.id);
    alert(`Downloading document: ${doc.name}`);
  }

  verifyDocument(doc: any) {
    if (this.selectedVerification) {
      const index = this.selectedVerification.documents.findIndex(d => d.id === doc.id);
      if (index !== -1) {
        this.selectedVerification.documents[index].status = 'verified';
        this.selectedVerification.documents[index].verifiedBy = 'Current User';
        this.selectedVerification.documents[index].verifiedAt = new Date();
      }
    }
  }

  rejectDocument(doc: any) {
    const reason = prompt('Please provide rejection reason:');
    if (reason && this.selectedVerification) {
      const index = this.selectedVerification.documents.findIndex(d => d.id === doc.id);
      if (index !== -1) {
        this.selectedVerification.documents[index].status = 'rejected';
        this.selectedVerification.documents[index].rejectionReason = reason;
      }
    }
  }

  closeVerificationModal() {
    this.showVerificationModal = false;
    this.selectedVerification = null;
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }
}

