import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

export interface DashboardOverview {
  summary: {
    balance: {
      total: number;
      available: number;
      wallets: number;
    };
    transactions: {
      count: number;
      volume: number;
      pending: number;
    };
    loans: {
      active: number;
      amount: number;
      pending: number;
    };
    savings: {
      goals: number;
      amount: number;
      completed: number;
    };
  };
  breakdown_type: string;
  chart_period?: string;
  breakdown: Array<{
    label: string;
    month?: string;
    date?: string;
    transactions: {
      count: number;
      volume: number;
    };
    balance: {
      total: number;
      change: number;
    };
  }>;
  recent_transactions?: Array<{
    id: string;
    amount: number;
    type: string;
    status: string;
    transaction_at: string;
    created_at: string;
    description: string;
    from_account?: {
      name: string;
      type: string;
    };
    to_account?: {
      name: string;
      type: string;
    };
  }>;
  date_range: {
    from: string;
    to: string;
  };
}

export interface Wallet {
  id: string;
  wallet_code: string;
  name: string;
  type: string;
  balance: number;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  /**
   * Get dashboard overview data
   */
  getOverview(dateFrom?: string, dateTo?: string): Observable<DashboardOverview> {
    // For now, return mock data for fintech app
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(this.getMockFintechData());
        observer.complete();
      }, 1000); // Simulate API delay
    });
  }

  /**
   * Get mock fintech data for dashboard
   */
  private getMockFintechData(): DashboardOverview {
    return {
      summary: {
        balance: {
          total: 2500000, // 2.5M RWF
          available: 1800000, // 1.8M RWF
          wallets: 4
        },
        transactions: {
          count: 127,
          volume: 4500000, // 4.5M RWF
          pending: 3
        },
        loans: {
          active: 2,
          amount: 500000, // 500K RWF
          pending: 1
        },
        savings: {
          goals: 5,
          amount: 750000, // 750K RWF
          completed: 2
        }
      },
      breakdown_type: 'daily',
      chart_period: '30D',
      breakdown: this.generateMockBreakdownData(),
      recent_transactions: this.generateMockRecentTransactions(),
      date_range: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      }
    };
  }

  /**
   * Generate mock breakdown data for charts
   */
  private generateMockBreakdownData(): Array<{
    label: string;
    date: string;
    transactions: {
      count: number;
      volume: number;
    };
    balance: {
      total: number;
      change: number;
    };
  }> {
    const data: Array<{
      label: string;
      date: string;
      transactions: {
        count: number;
        volume: number;
      };
      balance: {
        total: number;
        change: number;
      };
    }> = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      data.push({
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: date.toISOString().split('T')[0],
        transactions: {
          count: Math.floor(Math.random() * 20) + 5,
          volume: Math.floor(Math.random() * 200000) + 50000
        },
        balance: {
          total: Math.floor(Math.random() * 500000) + 2000000,
          change: Math.floor(Math.random() * 100000) - 50000
        }
      });
    }
    return data;
  }

  /**
   * Generate mock recent transactions
   */
  private generateMockRecentTransactions() {
    const transactionTypes = ['send', 'receive', 'loan', 'savings', 'payment'];
    const statuses = ['completed', 'pending', 'failed'];
    const accounts = ['John Doe', 'Jane Smith', 'Business Account', 'Savings Goal', 'Loan Payment'];
    
    return Array.from({ length: 8 }, (_, i) => ({
      id: `txn_${i + 1}`,
      amount: Math.floor(Math.random() * 500000) + 10000,
      type: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      transaction_at: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
      description: `Transaction ${i + 1} description`,
      from_account: {
        name: accounts[Math.floor(Math.random() * accounts.length)],
        type: 'individual'
      },
      to_account: {
        name: accounts[Math.floor(Math.random() * accounts.length)],
        type: 'individual'
      }
    }));
  }

  /**
   * Get user wallets
   */
  getWallets(): Observable<Wallet[]> {
    const token = localStorage.getItem(this.configService.tokenKey);
    if (!token) {
      return throwError(() => 'No authentication token found');
    }

    return this.http.post<any>(this.configService.getFullUrl('/wallets/get'), { token }).pipe(
      map(response => {
        if (response.code === 200 && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to get wallets');
      }),
      catchError(error => {
        console.error('Failed to get wallets:', error);
        return throwError(() => this.handleHttpError(error));
      })
    );
  }

  /**
   * Get dashboard statistics based on user role
   */
  getRoleBasedStats(): Observable<any> {
    const token = localStorage.getItem(this.configService.tokenKey);
    if (!token) {
      return throwError(() => 'No authentication token found');
    }

    return this.http.post<any>(this.configService.getFullUrl('/stats/overview'), { token }).pipe(
      map(response => {
        if (response.code === 200 && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to get role-based stats');
      }),
      catchError(error => {
        console.error('Failed to get role-based stats:', error);
        return throwError(() => this.handleHttpError(error));
      })
    );
  }

  private handleHttpError(error: any): string {
    if (error.status === 401) {
      return 'Authentication failed. Please login again.';
    } else if (error.status === 404) {
      return 'Service not found.';
    } else if (error.status === 400) {
      return 'Invalid parameters. Please check your input.';
    } else if (error.status === 500) {
      return 'Server error. Please try again later.';
    } else if (error.status === 0) {
      return 'No internet connection. Please check your network.';
    } else {
      return error.message || 'An unexpected error occurred.';
    }
  }
}
