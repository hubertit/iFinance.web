import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface Lender {
  id: string;
  name: string;
  email: string;
  phone: string;
  institutionName: string;
  licenseNumber: string;
  status: 'active' | 'inactive' | 'suspended';
  lendingCapacity: number;
  interestRateRange: {
    min: number;
    max: number;
  };
  specialties: string[];
  createdAt: Date;
  lastLoginAt?: Date;
  avatar?: string;
}

export type LoanType = 'cash' | 'asset';

export interface AssetCollateral {
  assetType: 'vehicle' | 'property' | 'equipment' | 'land' | 'machinery' | 'other';
  assetDescription: string;
  assetValue: number;
  valuationDate?: Date;
  valuationReport?: string; // File path or URL
  ownershipDocument?: string; // File path or URL
  registrationNumber?: string; // For vehicles, machinery
  location?: string; // For property, land
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  insuranceCoverage?: boolean;
  insuranceDetails?: string;
}

export interface LoanProduct {
  id: string;
  name: string;
  description: string;
  loanType: LoanType;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  termMonths: number;
  requirements: string[];
  assetRequirements?: string[]; // Additional requirements for asset loans
  isActive: boolean;
  createdAt: Date;
}

export interface LoanApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantPhone: string;
  productId: string;
  productName: string;
  loanType: LoanType;
  amount: number;
  termMonths: number;
  purpose: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'completed' | 'defaulted';
  creditScore?: number;
  riskLevel: 'low' | 'medium' | 'high';
  documents: string[];
  // Asset-specific fields
  collateral?: AssetCollateral;
  submittedAt: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  disbursedAt?: Date;
  notes?: string;
  rejectionReason?: string;
}

export interface LoanDisbursement {
  id: string;
  applicationId: string;
  amount: number;
  disbursementDate: Date;
  method: 'bank_transfer' | 'mobile_money' | 'cash';
  reference: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface ActiveLoan {
  id: string;
  loanNumber: string;
  applicationId: string;
  borrowerId: string;
  borrowerName: string;
  borrowerPhone: string;
  productId: string;
  productName: string;
  loanType: LoanType;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  outstandingBalance: number;
  totalPaid: number;
  disbursedAmount: number;
  disbursedAt: Date;
  nextPaymentDate: Date;
  status: 'active' | 'completed' | 'defaulted';
  daysPastDue: number;
  paymentsRemaining: number;
  paymentsCompleted: number;
  // Asset-specific fields
  collateral?: AssetCollateral;
}

@Injectable({
  providedIn: 'root'
})
export class LenderService {
  private lendersSubject = new BehaviorSubject<Lender[]>([]);
  private loanProductsSubject = new BehaviorSubject<LoanProduct[]>([]);
  private loanApplicationsSubject = new BehaviorSubject<LoanApplication[]>([]);
  private activeLoansSubject = new BehaviorSubject<ActiveLoan[]>([]);
  private currentLenderSubject = new BehaviorSubject<Lender | null>(null);

  public lenders$ = this.lendersSubject.asObservable();
  public loanProducts$ = this.loanProductsSubject.asObservable();
  public loanApplications$ = this.loanApplicationsSubject.asObservable();
  public activeLoans$ = this.activeLoansSubject.asObservable();
  public currentLender$ = this.currentLenderSubject.asObservable();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock Lenders
    const mockLenders: Lender[] = [
      {
        id: 'LENDER-1',
        name: 'Dr. Jean Baptiste Nkurunziza',
        email: 'jean.nkurunziza@ruralfinance.rw',
        phone: '+250788123456',
        institutionName: 'Rural Finance Cooperative',
        licenseNumber: 'RFC-2024-001',
        status: 'active',
        lendingCapacity: 50000000, // 50M RWF
        interestRateRange: { min: 12, max: 24 },
        specialties: ['agricultural', 'small_business', 'microfinance'],
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        lastLoginAt: new Date(),
        avatar: 'briefcase'
      },
      {
        id: 'LENDER-2',
        name: 'Marie Claire Uwimana',
        email: 'marie.uwimana@kigali.bank',
        phone: '+250788234567',
        institutionName: 'Kigali Commercial Bank',
        licenseNumber: 'KCB-2024-002',
        status: 'active',
        lendingCapacity: 200000000, // 200M RWF
        interestRateRange: { min: 8, max: 18 },
        specialties: ['business', 'mortgage', 'education'],
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
        lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        avatar: 'building'
      },
      {
        id: 'LENDER-3',
        name: 'Paul Mugenzi',
        email: 'paul.mugenzi@microcredit.rw',
        phone: '+250788345678',
        institutionName: 'MicroCredit Rwanda',
        licenseNumber: 'MCR-2024-003',
        status: 'active',
        lendingCapacity: 10000000, // 10M RWF
        interestRateRange: { min: 15, max: 30 },
        specialties: ['microfinance', 'women_empowerment', 'youth'],
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
        lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        avatar: 'users'
      }
    ];

    // Loan Products: Phones (100k) and Startup Capital (150k)
    const mockLoanProducts: LoanProduct[] = [
      {
        id: 'PRODUCT-PHONES',
        name: 'Phones',
        description: 'Loan for purchasing phones and mobile devices',
        loanType: 'cash',
        minAmount: 100000,
        maxAmount: 100000,
        interestRate: 0, // No interest
        termMonths: 12,
        requirements: ['Valid NID', 'Phone number verification'],
        isActive: true,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
      },
      {
        id: 'PRODUCT-STARTUP',
        name: 'Startup Capital',
        description: 'Startup capital loan for business initiation',
        loanType: 'cash',
        minAmount: 150000,
        maxAmount: 150000,
        interestRate: 0, // No interest
        termMonths: 12,
        requirements: ['Valid NID', 'Business plan', 'Business registration'],
        isActive: true,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
      }
    ];

    // Loan Applications: All DJYH borrowers have applications for both products (Phones + Startup Capital)
    // All applications are approved and disbursed
    // Note: Actual applications are generated from borrowers fetched from DJYH API
    // This is placeholder data - real data comes from API via borrowers-list component
    const disbursedDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const mockLoanApplications: LoanApplication[] = [];
    // Applications are generated dynamically from DJYH API borrowers
    // Each borrower has 2 applications: Phones (100k) and Startup Capital (150k)
    // All are approved and disbursed

    // Active Loans: All DJYH borrowers have 2 loans (Phones: 100k, Startup Capital: 150k)
    // Total: 250k per borrower, no payments yet, will start paying Dec 1, 2024
    // All loans are active and approved
    // Note: Actual loans are generated from borrowers fetched from DJYH API
    // This is placeholder data - real data comes from API via borrowers-list component
    const mockActiveLoans: ActiveLoan[] = [];
    // Loans are generated dynamically from DJYH API borrowers
    // Each borrower has 2 active loans: Phones (100k) and Startup Capital (150k)
    // All loans are active, no payments yet, payments start Dec 1, 2024

    this.lendersSubject.next(mockLenders);
    this.loanProductsSubject.next(mockLoanProducts);
    this.loanApplicationsSubject.next(mockLoanApplications);
    this.activeLoansSubject.next(mockActiveLoans);
    
    // Set first lender as current
    this.currentLenderSubject.next(mockLenders[0]);
  }

  // Lender methods
  getLenders(): Lender[] {
    return this.lendersSubject.value;
  }

  getCurrentLender(): Lender | null {
    return this.currentLenderSubject.value;
  }

  switchLender(lenderId: string): void {
    const lenders = this.lendersSubject.value;
    const lender = lenders.find(l => l.id === lenderId);
    if (lender) {
      this.currentLenderSubject.next(lender);
    }
  }

  // Loan Product methods
  getLoanProducts(): LoanProduct[] {
    return this.loanProductsSubject.value;
  }

  getActiveLoanProducts(): LoanProduct[] {
    return this.loanProductsSubject.value.filter(product => product.isActive);
  }

  addLoanProduct(product: Omit<LoanProduct, 'id' | 'createdAt'>): void {
    const newProduct: LoanProduct = {
      ...product,
      id: `PRODUCT-${Date.now()}`,
      createdAt: new Date()
    };
    const products = this.loanProductsSubject.value;
    this.loanProductsSubject.next([...products, newProduct]);
  }

  updateLoanProduct(productId: string, updates: Partial<LoanProduct>): void {
    const products = this.loanProductsSubject.value;
    const updatedProducts = products.map(p => 
      p.id === productId ? { ...p, ...updates } : p
    );
    this.loanProductsSubject.next(updatedProducts);
  }

  // Loan Application methods
  getLoanApplications(): LoanApplication[] {
    return this.loanApplicationsSubject.value;
  }

  getLoanApplicationsByStatus(status: string): LoanApplication[] {
    return this.loanApplicationsSubject.value.filter(app => app.status === status);
  }

  getPendingApplications(): LoanApplication[] {
    return this.getLoanApplicationsByStatus('pending');
  }

  getUnderReviewApplications(): LoanApplication[] {
    return this.getLoanApplicationsByStatus('under_review');
  }

  getApprovedApplications(): LoanApplication[] {
    return this.getLoanApplicationsByStatus('approved');
  }

  updateApplicationStatus(applicationId: string, status: string, notes?: string): void {
    const applications = this.loanApplicationsSubject.value;
    const updatedApplications = applications.map(app => {
      if (app.id === applicationId) {
        const updatedApp = { ...app, status: status as any };
        if (notes) updatedApp.notes = notes;
        if (status === 'approved') updatedApp.approvedAt = new Date();
        if (status === 'under_review') updatedApp.reviewedAt = new Date();
        return updatedApp;
      }
      return app;
    });
    this.loanApplicationsSubject.next(updatedApplications);
  }

  rejectApplication(applicationId: string, reason: string): void {
    this.updateApplicationStatus(applicationId, 'rejected');
    const applications = this.loanApplicationsSubject.value;
    const updatedApplications = applications.map(app => {
      if (app.id === applicationId) {
        return { ...app, status: 'rejected' as any, rejectionReason: reason };
      }
      return app;
    });
    this.loanApplicationsSubject.next(updatedApplications);
  }

  approveApplication(applicationId: string, notes?: string): void {
    this.updateApplicationStatus(applicationId, 'approved', notes);
  }

  disburseLoan(applicationId: string): void {
    this.updateApplicationStatus(applicationId, 'disbursed');
    const applications = this.loanApplicationsSubject.value;
    const updatedApplications = applications.map(app => {
      if (app.id === applicationId) {
        return { ...app, status: 'disbursed' as any, disbursedAt: new Date() };
      }
      return app;
    });
    this.loanApplicationsSubject.next(updatedApplications);
  }

  // Analytics methods
  getLenderStats(): any {
    const applications = this.loanApplicationsSubject.value;
    const products = this.loanProductsSubject.value;
    
    return {
      totalApplications: applications.length,
      pendingApplications: applications.filter(app => app.status === 'pending').length,
      underReviewApplications: applications.filter(app => app.status === 'under_review').length,
      approvedApplications: applications.filter(app => app.status === 'approved').length,
      rejectedApplications: applications.filter(app => app.status === 'rejected').length,
      disbursedLoans: applications.filter(app => app.status === 'disbursed').length,
      totalLoanAmount: applications
        .filter(app => ['approved', 'disbursed', 'completed'].includes(app.status))
        .reduce((sum, app) => sum + app.amount, 0),
      averageLoanAmount: this.calculateAverageLoanAmount(),
      approvalRate: this.calculateApprovalRate(),
      activeProducts: products.filter(product => product.isActive).length
    };
  }

  private calculateAverageLoanAmount(): number {
    const applications = this.loanApplicationsSubject.value;
    const approvedApplications = applications.filter(app => 
      ['approved', 'disbursed', 'completed'].includes(app.status)
    );
    return approvedApplications.length > 0 
      ? approvedApplications.reduce((sum, app) => sum + app.amount, 0) / approvedApplications.length
      : 0;
  }

  private calculateApprovalRate(): number {
    const applications = this.loanApplicationsSubject.value;
    const reviewedApplications = applications.filter(app => 
      ['approved', 'rejected'].includes(app.status)
    );
    const approvedApplications = applications.filter(app => app.status === 'approved');
    return reviewedApplications.length > 0 
      ? (approvedApplications.length / reviewedApplications.length) * 100
      : 0;
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'low': return '#1abc9c';
      case 'medium': return '#f39c12';
      case 'high': return '#e74c3c';
      default: return '#6c757d';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'under_review': return '#3498db';
      case 'approved': return '#1abc9c';
      case 'rejected': return '#e74c3c';
      case 'disbursed': return '#27ae60';
      case 'completed': return '#2ecc71';
      case 'defaulted': return '#e74c3c';
      case 'active': return '#3498db';
      default: return '#6c757d';
    }
  }

  // Active Loan methods
  getActiveLoans(): ActiveLoan[] {
    return this.activeLoansSubject.value;
  }

  getActiveLoansByStatus(status: 'active' | 'completed' | 'defaulted'): ActiveLoan[] {
    return this.activeLoansSubject.value.filter(loan => loan.status === status);
  }

  getOverdueLoans(): ActiveLoan[] {
    return this.activeLoansSubject.value.filter(loan => loan.daysPastDue > 0);
  }

  updateActiveLoan(loanId: string, updates: Partial<ActiveLoan>): void {
    const loans = this.activeLoansSubject.value;
    const updatedLoans = loans.map(loan => 
      loan.id === loanId ? { ...loan, ...updates } : loan
    );
    this.activeLoansSubject.next(updatedLoans);
  }

  /**
   * Generate loans and applications from DJYH borrowers
   * All borrowers have 2 loans: Phones (100k) and Startup Capital (150k)
   * All applications are approved and disbursed
   * All loans are active
   */
  generateLoansFromBorrowers(borrowers: Array<{id: string, name: string, phone: string, email?: string}>): void {
    const paymentStartDate = new Date('2024-12-01');
    const monthlyPaymentPhones = 100000 / 12; // 8,333 RWF per month (no interest)
    const monthlyPaymentStartup = 150000 / 12; // 12,500 RWF per month (no interest)
    const disbursedDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    const activeLoans: ActiveLoan[] = [];
    const loanApplications: LoanApplication[] = [];

    borrowers.forEach((borrower, index) => {
      const borrowerId = borrower.id;
      const borrowerName = borrower.name;
      const borrowerPhone = borrower.phone || '';

      // Generate Phones loan
      const phonesLoanId = `LOAN-PHONES-${borrowerId}`;
      const phonesAppId = `APP-PHONES-${borrowerId}`;
      
      activeLoans.push({
        id: phonesLoanId,
        loanNumber: `LN-PHONES-${String(index + 1).padStart(4, '0')}`,
        applicationId: phonesAppId,
        borrowerId: borrowerId,
        borrowerName: borrowerName,
        borrowerPhone: borrowerPhone,
        productId: 'PRODUCT-PHONES',
        productName: 'Phones',
        loanType: 'cash',
        principalAmount: 100000,
        interestRate: 0, // No interest
        termMonths: 12,
        monthlyPayment: monthlyPaymentPhones,
        outstandingBalance: 100000, // Full amount (no payments yet)
        totalPaid: 0,
        disbursedAmount: 100000,
        disbursedAt: disbursedDate,
        nextPaymentDate: paymentStartDate,
        status: 'active',
        daysPastDue: 0,
        paymentsRemaining: 12,
        paymentsCompleted: 0
      });

      loanApplications.push({
        id: phonesAppId,
        applicantId: borrowerId,
        applicantName: borrowerName,
        applicantPhone: borrowerPhone,
        productId: 'PRODUCT-PHONES',
        productName: 'Phones',
        loanType: 'cash',
        amount: 100000,
        termMonths: 12,
        purpose: 'Purchase of mobile phone for business communication',
        status: 'disbursed',
        creditScore: 650,
        riskLevel: 'low',
        documents: ['nid_front.jpg', 'nid_back.jpg'],
        submittedAt: new Date(disbursedDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(disbursedDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(disbursedDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        disbursedAt: disbursedDate,
        notes: 'Approved - Standard phone loan application'
      });

      // Generate Startup Capital loan
      const startupLoanId = `LOAN-STARTUP-${borrowerId}`;
      const startupAppId = `APP-STARTUP-${borrowerId}`;
      
      activeLoans.push({
        id: startupLoanId,
        loanNumber: `LN-STARTUP-${String(index + 1).padStart(4, '0')}`,
        applicationId: startupAppId,
        borrowerId: borrowerId,
        borrowerName: borrowerName,
        borrowerPhone: borrowerPhone,
        productId: 'PRODUCT-STARTUP',
        productName: 'Startup Capital',
        loanType: 'cash',
        principalAmount: 150000,
        interestRate: 0, // No interest
        termMonths: 12,
        monthlyPayment: monthlyPaymentStartup,
        outstandingBalance: 150000, // Full amount (no payments yet)
        totalPaid: 0,
        disbursedAmount: 150000,
        disbursedAt: disbursedDate,
        nextPaymentDate: paymentStartDate,
        status: 'active',
        daysPastDue: 0,
        paymentsRemaining: 12,
        paymentsCompleted: 0
      });

      loanApplications.push({
        id: startupAppId,
        applicantId: borrowerId,
        applicantName: borrowerName,
        applicantPhone: borrowerPhone,
        productId: 'PRODUCT-STARTUP',
        productName: 'Startup Capital',
        loanType: 'cash',
        amount: 150000,
        termMonths: 12,
        purpose: 'Startup capital for small business initiation',
        status: 'disbursed',
        creditScore: 650,
        riskLevel: 'low',
        documents: ['nid_front.jpg', 'business_plan.pdf'],
        submittedAt: new Date(disbursedDate.getTime() - 5 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(disbursedDate.getTime() - 3 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(disbursedDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        disbursedAt: disbursedDate,
        notes: 'Approved - Standard startup capital application'
      });
    });

    // Update the service with generated loans and applications
    this.activeLoansSubject.next(activeLoans);
    this.loanApplicationsSubject.next(loanApplications);
  }
}
