import { Injectable } from '@angular/core';

export interface MockCredentials {
  role: string;
  email: string;
  password: string;
  name: string;
  description: string;
  features: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MockCredentialsService {
  
  private mockCredentials: MockCredentials[] = [
    {
      role: 'lender',
      email: 'lender@ifinance.rw',
      password: 'Pass123',
      name: 'Dr. Jean Baptiste Nkurunziza',
      description: 'Rural Finance Cooperative - Senior Loan Officer',
      features: [
        'Review loan applications',
        'Approve/reject loans',
        'Manage loan products',
        'Track lending performance',
        'Disburse approved loans'
      ]
    },
    {
      role: 'lender',
      email: 'marie@ifinance.rw',
      password: 'Pass123',
      name: 'Marie Claire Uwimana',
      description: 'Kigali Commercial Bank - Business Loan Manager',
      features: [
        'Business loan management',
        'Credit risk assessment',
        'Portfolio analytics',
        'Customer relationship management'
      ]
    },
    {
      role: 'lender',
      email: 'paul@ifinance.rw',
      password: 'Pass123',
      name: 'Paul Mugenzi',
      description: 'MicroCredit Rwanda - Microfinance Specialist',
      features: [
        'Microfinance operations',
        'Women empowerment loans',
        'Youth entrepreneurship support',
        'Community development'
      ]
    },
    {
      role: 'customer',
      email: 'customer@ifinance.rw',
      password: 'Pass123',
      name: 'John Mukamana',
      description: 'Individual Customer - Farmer',
      features: [
        'Apply for loans',
        'View loan status',
        'Make payments',
        'Track loan history'
      ]
    },
    {
      role: 'admin',
      email: 'admin@ifinance.rw',
      password: 'Pass123',
      name: 'System Administrator',
      description: 'Full system access and management',
      features: [
        'User management',
        'System configuration',
        'Analytics and reporting',
        'Platform maintenance'
      ]
    }
  ];

  getMockCredentials(): MockCredentials[] {
    return this.mockCredentials;
  }

  getCredentialsByRole(role: string): MockCredentials[] {
    return this.mockCredentials.filter(cred => cred.role === role);
  }

  getLenderCredentials(): MockCredentials[] {
    return this.getCredentialsByRole('lender');
  }

  getCustomerCredentials(): MockCredentials[] {
    return this.getCredentialsByRole('customer');
  }

  getAdminCredentials(): MockCredentials[] {
    return this.getCredentialsByRole('admin');
  }

  validateCredentials(email: string, password: string): MockCredentials | null {
    return this.mockCredentials.find(cred => 
      cred.email === email && cred.password === password
    ) || null;
  }

  getCredentialsByEmail(email: string): MockCredentials | null {
    return this.mockCredentials.find(cred => cred.email === email) || null;
  }

  // Helper method to get role-specific features
  getFeaturesByRole(role: string): string[] {
    const credentials = this.getCredentialsByRole(role);
    return credentials.length > 0 ? credentials[0].features : [];
  }

  // Helper method to get all available roles
  getAvailableRoles(): string[] {
    return [...new Set(this.mockCredentials.map(cred => cred.role))];
  }

  // Helper method to get role display name
  getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'lender': 'Lender',
      'customer': 'Customer',
      'admin': 'Administrator',
      'agent': 'Agent',
      'partner': 'Business Partner',
      'insurer': 'Insurance Provider'
    };
    return roleMap[role] || role;
  }

  // Helper method to get role description
  getRoleDescription(role: string): string {
    const descriptions: { [key: string]: string } = {
      'lender': 'Financial institutions and individual lenders who provide loans to customers',
      'customer': 'End users who apply for loans and use financial services',
      'admin': 'System administrators with full platform access',
      'agent': 'Field representatives who assist customers',
      'partner': 'Business partners and merchants',
      'insurer': 'Insurance providers offering coverage products'
    };
    return descriptions[role] || 'User role in the system';
  }
}
