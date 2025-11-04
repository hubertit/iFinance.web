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

    // Mock Loan Products
    const mockLoanProducts: LoanProduct[] = [
      {
        id: 'PRODUCT-1',
        name: 'Agricultural Development Loan',
        description: 'Low-interest loan for farmers to purchase equipment, seeds, and fertilizers',
        loanType: 'cash',
        minAmount: 500000,
        maxAmount: 5000000,
        interestRate: 12,
        termMonths: 24,
        requirements: ['Valid NID', 'Land ownership certificate', 'Farming plan', 'Guarantor'],
        isActive: true,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'PRODUCT-2',
        name: 'Small Business Loan',
        description: 'Working capital loan for small businesses and entrepreneurs',
        loanType: 'cash',
        minAmount: 1000000,
        maxAmount: 10000000,
        interestRate: 18,
        termMonths: 36,
        requirements: ['Business registration', 'Bank statements (6 months)', 'Business plan'],
        isActive: true,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'PRODUCT-3',
        name: 'Asset-Backed Business Loan',
        description: 'Loan secured by business assets (vehicles, equipment, machinery)',
        loanType: 'asset',
        minAmount: 2000000,
        maxAmount: 20000000,
        interestRate: 15,
        termMonths: 36,
        requirements: ['Business registration', 'Bank statements (6 months)', 'Business plan'],
        assetRequirements: ['Asset ownership documents', 'Asset valuation report', 'Insurance certificate', 'Asset registration'],
        isActive: true,
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'PRODUCT-4',
        name: 'Vehicle Financing',
        description: 'Loan for purchasing vehicles (cars, motorcycles, trucks)',
        loanType: 'asset',
        minAmount: 1000000,
        maxAmount: 15000000,
        interestRate: 14,
        termMonths: 48,
        requirements: ['Valid NID', 'Valid driving license', 'Income proof'],
        assetRequirements: ['Vehicle registration documents', 'Vehicle valuation report', 'Insurance certificate', 'Vehicle inspection report'],
        isActive: true,
        createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'PRODUCT-5',
        name: 'Property Mortgage Loan',
        description: 'Loan secured by real estate property',
        loanType: 'asset',
        minAmount: 5000000,
        maxAmount: 100000000,
        interestRate: 12,
        termMonths: 120,
        requirements: ['Valid NID', 'Income proof', 'Tax clearance certificate'],
        assetRequirements: ['Property title deed', 'Property valuation report', 'Property tax clearance', 'Land survey report'],
        isActive: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'PRODUCT-6',
        name: 'Education Loan',
        description: 'Student loan for higher education and vocational training',
        loanType: 'cash',
        minAmount: 200000,
        maxAmount: 2000000,
        interestRate: 10,
        termMonths: 48,
        requirements: ['Admission letter', 'Academic transcripts', 'Parent/Guardian guarantee', 'School fee structure'],
        isActive: true,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'PRODUCT-7',
        name: 'Micro Loan',
        description: 'Quick access loan for immediate financial needs',
        loanType: 'cash',
        minAmount: 50000,
        maxAmount: 500000,
        interestRate: 25,
        termMonths: 6,
        requirements: ['Valid NID', 'Income proof', 'Mobile money account'],
        isActive: true,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      }
    ];

    // Mock Loan Applications
    const mockLoanApplications: LoanApplication[] = [
      {
        id: 'APP-1',
        applicantId: 'CUST-001',
        applicantName: 'John Mukamana',
        applicantPhone: '+250788111111',
        productId: 'PRODUCT-1',
        productName: 'Agricultural Development Loan',
        loanType: 'cash',
        amount: 2000000,
        termMonths: 24,
        purpose: 'Purchase of farming equipment and seeds for maize cultivation',
        status: 'under_review',
        creditScore: 720,
        riskLevel: 'low',
        documents: ['nid_front.jpg', 'nid_back.jpg', 'land_certificate.pdf', 'farming_plan.pdf'],
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        notes: 'Strong credit history, good farming experience'
      },
      {
        id: 'APP-2',
        applicantId: 'CUST-002',
        applicantName: 'Marie Uwimana',
        applicantPhone: '+250788222222',
        productId: 'PRODUCT-2',
        productName: 'Small Business Loan',
        loanType: 'cash',
        amount: 5000000,
        termMonths: 36,
        purpose: 'Expansion of retail shop and inventory purchase',
        status: 'approved',
        creditScore: 680,
        riskLevel: 'medium',
        documents: ['business_registration.pdf', 'bank_statements.pdf', 'business_plan.pdf'],
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        notes: 'Business shows good growth potential'
      },
      {
        id: 'APP-2A',
        applicantId: 'CUST-012',
        applicantName: 'Peter Nkurunziza',
        applicantPhone: '+250788888888',
        productId: 'PRODUCT-4',
        productName: 'Vehicle Financing',
        loanType: 'asset',
        amount: 8000000,
        termMonths: 48,
        purpose: 'Purchase of delivery truck for logistics business',
        status: 'under_review',
        creditScore: 700,
        riskLevel: 'low',
        documents: ['nid_front.jpg', 'driving_license.pdf', 'business_registration.pdf'],
        collateral: {
          assetType: 'vehicle',
          assetDescription: 'Toyota Hilux Double Cab 2024',
          assetValue: 12000000,
          valuationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          valuationReport: 'vehicle_valuation_report.pdf',
          ownershipDocument: 'vehicle_ownership.pdf',
          registrationNumber: 'RAB-2024-ABC-123',
          condition: 'excellent',
          insuranceCoverage: true,
          insuranceDetails: 'Comprehensive insurance with First Insurance Ltd'
        },
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        notes: 'Asset well-documented, good loan-to-value ratio'
      },
      {
        id: 'APP-3',
        applicantId: 'CUST-003',
        applicantName: 'Alice Mukamana',
        applicantPhone: '+250788333333',
        productId: 'PRODUCT-6',
        productName: 'Education Loan',
        loanType: 'cash',
        amount: 1500000,
        termMonths: 48,
        purpose: 'University tuition fees for Computer Science degree',
        status: 'pending',
        creditScore: 650,
        riskLevel: 'medium',
        documents: ['admission_letter.pdf', 'academic_transcripts.pdf', 'parent_guarantee.pdf'],
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        notes: 'Student with good academic record'
      },
      {
        id: 'APP-3A',
        applicantId: 'CUST-013',
        applicantName: 'Jean Baptiste Nkurunziza',
        applicantPhone: '+250788999999',
        productId: 'PRODUCT-5',
        productName: 'Property Mortgage Loan',
        loanType: 'asset',
        amount: 25000000,
        termMonths: 120,
        purpose: 'Construction of commercial building for rental income',
        status: 'approved',
        creditScore: 750,
        riskLevel: 'low',
        documents: ['nid_front.jpg', 'tax_clearance.pdf', 'income_proof.pdf'],
        collateral: {
          assetType: 'property',
          assetDescription: 'Commercial plot in Kigali CBD, 500 sqm',
          assetValue: 40000000,
          valuationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          valuationReport: 'property_valuation_report.pdf',
          ownershipDocument: 'title_deed.pdf',
          location: 'Kigali, Nyarugenge District, KN 1 Ave',
          condition: 'excellent',
          insuranceCoverage: true,
          insuranceDetails: 'Property insurance with Sonarwa'
        },
        submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        reviewedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        approvedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        notes: 'Excellent collateral, prime location, strong borrower profile'
      },
      {
        id: 'APP-4',
        applicantId: 'CUST-004',
        applicantName: 'Sarah Mukamana',
        applicantPhone: '+250788444444',
        productId: 'PRODUCT-7',
        productName: 'Micro Loan',
        loanType: 'cash',
        amount: 200000,
        termMonths: 6,
        purpose: 'Emergency medical expenses for family member',
        status: 'rejected',
        creditScore: 580,
        riskLevel: 'high',
        documents: ['nid_front.jpg', 'medical_bills.pdf'],
        submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        rejectionReason: 'Insufficient income documentation and high debt-to-income ratio'
      },
      {
        id: 'APP-5',
        applicantId: 'CUST-005',
        applicantName: 'David Nsabimana',
        applicantPhone: '+250788555555',
        productId: 'PRODUCT-1',
        productName: 'Agricultural Development Loan',
        loanType: 'cash',
        amount: 3000000,
        termMonths: 24,
        purpose: 'Dairy farming expansion and equipment purchase',
        status: 'disbursed',
        creditScore: 750,
        riskLevel: 'low',
        documents: ['nid_front.jpg', 'nid_back.jpg', 'land_certificate.pdf', 'farming_plan.pdf'],
        submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        reviewedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        approvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        disbursedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        notes: 'Excellent farming track record and collateral'
      },
      {
        id: 'APP-5A',
        applicantId: 'CUST-014',
        applicantName: 'Paul Mugenzi',
        applicantPhone: '+250788101010',
        productId: 'PRODUCT-3',
        productName: 'Asset-Backed Business Loan',
        loanType: 'asset',
        amount: 12000000,
        termMonths: 36,
        purpose: 'Purchase of manufacturing equipment for textile business',
        status: 'disbursed',
        creditScore: 720,
        riskLevel: 'low',
        documents: ['business_registration.pdf', 'bank_statements.pdf', 'business_plan.pdf'],
        collateral: {
          assetType: 'machinery',
          assetDescription: 'Textile weaving machines (5 units) - Model XYZ 2024',
          assetValue: 18000000,
          valuationDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          valuationReport: 'equipment_valuation_report.pdf',
          ownershipDocument: 'equipment_invoice.pdf',
          registrationNumber: 'EQ-2024-TXT-001',
          condition: 'excellent',
          insuranceCoverage: true,
          insuranceDetails: 'Equipment insurance with Prudential Assurance'
        },
        submittedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        reviewedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), // 22 days ago
        approvedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
        disbursedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        notes: 'High-value asset with good LTV ratio, business shows strong potential'
      }
    ];

    // Mock Active Loans (converted from disbursed applications)
    const mockActiveLoans: ActiveLoan[] = [
      {
        id: 'LOAN-1',
        loanNumber: 'LN-2024-001',
        applicationId: 'APP-5',
        borrowerId: 'CUST-005',
        borrowerName: 'David Nsabimana',
        borrowerPhone: '+250788555555',
        productId: 'PRODUCT-1',
        productName: 'Agricultural Development Loan',
        loanType: 'cash',
        principalAmount: 3000000,
        interestRate: 12,
        termMonths: 24,
        monthlyPayment: 141250,
        outstandingBalance: 2825000,
        totalPaid: 282500,
        disbursedAmount: 3000000,
        disbursedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        nextPaymentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        status: 'active',
        daysPastDue: 0,
        paymentsRemaining: 20,
        paymentsCompleted: 4
      },
      {
        id: 'LOAN-1A',
        loanNumber: 'LN-2024-003',
        applicationId: 'APP-5A',
        borrowerId: 'CUST-014',
        borrowerName: 'Paul Mugenzi',
        borrowerPhone: '+250788101010',
        productId: 'PRODUCT-3',
        productName: 'Asset-Backed Business Loan',
        loanType: 'asset',
        principalAmount: 12000000,
        interestRate: 15,
        termMonths: 36,
        monthlyPayment: 416667,
        outstandingBalance: 10833333,
        totalPaid: 1250000,
        disbursedAmount: 12000000,
        disbursedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        nextPaymentDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        status: 'active',
        daysPastDue: 0,
        paymentsRemaining: 33,
        paymentsCompleted: 3,
        collateral: {
          assetType: 'machinery',
          assetDescription: 'Textile weaving machines (5 units) - Model XYZ 2024',
          assetValue: 18000000,
          valuationDate: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000),
          valuationReport: 'equipment_valuation_report.pdf',
          ownershipDocument: 'equipment_invoice.pdf',
          registrationNumber: 'EQ-2024-TXT-001',
          condition: 'excellent',
          insuranceCoverage: true,
          insuranceDetails: 'Equipment insurance with Prudential Assurance'
        }
      },
      {
        id: 'LOAN-2',
        loanNumber: 'LN-2024-002',
        applicationId: 'APP-2',
        borrowerId: 'CUST-002',
        borrowerName: 'Marie Uwimana',
        borrowerPhone: '+250788222222',
        productId: 'PRODUCT-2',
        productName: 'Small Business Loan',
        loanType: 'cash',
        principalAmount: 5000000,
        interestRate: 18,
        termMonths: 36,
        monthlyPayment: 183333,
        outstandingBalance: 4166667,
        totalPaid: 1833333,
        disbursedAmount: 5000000,
        disbursedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
        nextPaymentDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        status: 'active',
        daysPastDue: 0,
        paymentsRemaining: 32,
        paymentsCompleted: 10
      },
      {
        id: 'LOAN-3',
        loanNumber: 'LN-2023-015',
        applicationId: 'APP-OLD-1',
        borrowerId: 'CUST-010',
        borrowerName: 'Jean Baptiste',
        borrowerPhone: '+250788666666',
        productId: 'PRODUCT-1',
        productName: 'Agricultural Development Loan',
        loanType: 'cash',
        principalAmount: 2000000,
        interestRate: 12,
        termMonths: 24,
        monthlyPayment: 94167,
        outstandingBalance: 470835,
        totalPaid: 1883335,
        disbursedAmount: 2000000,
        disbursedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 days ago
        nextPaymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
        status: 'active',
        daysPastDue: 5,
        paymentsRemaining: 5,
        paymentsCompleted: 19
      },
      {
        id: 'LOAN-4',
        loanNumber: 'LN-2023-020',
        applicationId: 'APP-OLD-2',
        borrowerId: 'CUST-011',
        borrowerName: 'Sarah Mukamana',
        borrowerPhone: '+250788777777',
        productId: 'PRODUCT-7',
        productName: 'Micro Loan',
        loanType: 'cash',
        principalAmount: 500000,
        interestRate: 25,
        termMonths: 6,
        monthlyPayment: 96875,
        outstandingBalance: 0,
        totalPaid: 581250,
        disbursedAmount: 500000,
        disbursedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days ago
        nextPaymentDate: new Date(),
        status: 'completed',
        daysPastDue: 0,
        paymentsRemaining: 0,
        paymentsCompleted: 6
      }
    ];

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
}
