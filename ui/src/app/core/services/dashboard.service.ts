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
  getOverview(dateFrom?: string, dateTo?: string, walletId?: string): Observable<DashboardOverview> {
    // For now, return mock data for fintech app
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(this.getMockFintechData(walletId));
        observer.complete();
      }, 1000); // Simulate API delay
    });
  }

  /**
   * Get mock fintech data for dashboard
   */
  private getMockFintechData(walletId?: string): DashboardOverview {
    // Generate wallet-specific data based on walletId
    const walletData = this.getWalletSpecificData(walletId);
    
    return {
      summary: {
        balance: {
          total: walletData.balance.total,
          available: walletData.balance.available,
          wallets: walletData.balance.wallets
        },
        transactions: {
          count: walletData.transactions.count,
          volume: walletData.transactions.volume,
          pending: walletData.transactions.pending
        },
        loans: {
          active: walletData.loans.active,
          amount: walletData.loans.amount,
          pending: walletData.loans.pending
        },
        savings: {
          goals: walletData.savings.goals,
          amount: walletData.savings.amount,
          completed: walletData.savings.completed
        }
      },
      breakdown_type: 'daily',
      chart_period: '30D',
      breakdown: this.generateMockBreakdownData(walletId),
      recent_transactions: this.generateMockRecentTransactions(walletId),
      date_range: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
      }
    };
  }

  /**
   * Get wallet-specific data based on wallet ID
   */
  private getWalletSpecificData(walletId?: string) {
    // Default data for when no wallet is selected
    const defaultData = {
      balance: { total: 2500000, available: 1800000, wallets: 4 },
      transactions: { count: 127, volume: 4500000, pending: 3 },
      loans: { active: 2, amount: 500000, pending: 1 },
      savings: { goals: 5, amount: 750000, completed: 2 }
    };

    if (!walletId) {
      return defaultData;
    }

    // Generate different data based on wallet ID
    const walletVariations = {
      'wallet_1': {
        balance: { total: 1200000, available: 950000, wallets: 1 },
        transactions: { count: 45, volume: 1800000, pending: 1 },
        loans: { active: 1, amount: 250000, pending: 0 },
        savings: { goals: 2, amount: 300000, completed: 1 }
      },
      'wallet_2': {
        balance: { total: 3200000, available: 2800000, wallets: 1 },
        transactions: { count: 89, volume: 5200000, pending: 2 },
        loans: { active: 3, amount: 750000, pending: 1 },
        savings: { goals: 4, amount: 950000, completed: 2 }
      },
      'wallet_3': {
        balance: { total: 850000, available: 650000, wallets: 1 },
        transactions: { count: 23, volume: 1200000, pending: 0 },
        loans: { active: 0, amount: 0, pending: 0 },
        savings: { goals: 1, amount: 150000, completed: 0 }
      },
      'wallet_4': {
        balance: { total: 4500000, available: 4200000, wallets: 1 },
        transactions: { count: 156, volume: 7800000, pending: 4 },
        loans: { active: 2, amount: 1200000, pending: 2 },
        savings: { goals: 6, amount: 1800000, completed: 3 }
      }
    };

    return walletVariations[walletId as keyof typeof walletVariations] || defaultData;
  }

  /**
   * Generate mock breakdown data for charts
   */
  private generateMockBreakdownData(walletId?: string): Array<{
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
    
    // Get wallet-specific base values
    const walletData = this.getWalletSpecificData(walletId);
    const baseVolume = walletData.transactions.volume / 30; // Average daily volume
    const baseBalance = walletData.balance.total;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const volumeVariation = 0.3 + Math.random() * 0.4; // 30-70% of base volume
      const balanceVariation = 0.8 + Math.random() * 0.4; // 80-120% of base balance
      
      data.push({
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        date: date.toISOString().split('T')[0],
        transactions: {
          count: Math.floor(Math.random() * 15) + 3,
          volume: Math.floor(baseVolume * volumeVariation)
        },
        balance: {
          total: Math.floor(baseBalance * balanceVariation),
          change: Math.floor(Math.random() * 100000) - 50000
        }
      });
    }
    return data;
  }

  /**
   * Generate mock recent transactions
   */
  private generateMockRecentTransactions(walletId?: string) {
    const transactionTypes = ['send', 'receive', 'loan', 'savings', 'payment'];
    const statuses = ['completed', 'pending', 'failed'];
    const rwandaAccounts = [
      'Jean Baptiste', 'Marie Claire', 'François', 'Immaculée', 'Théophile', 'Véronique',
      'Emmanuel', 'Claudine', 'Pacifique', 'Joséphine', 'Innocent', 'Béatrice',
      'Fidèle', 'Glorieuse', 'Séraphin', 'Angélique', 'Boniface', 'Célestine'
    ];
    
    // Get wallet-specific transaction count
    const walletData = this.getWalletSpecificData(walletId);
    const transactionCount = Math.min(8, Math.floor(walletData.transactions.count / 15));
    
    return Array.from({ length: transactionCount }, (_, i) => ({
      id: `txn_${walletId || 'default'}_${i + 1}`,
      amount: Math.floor(Math.random() * 300000) + 5000,
      type: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      transaction_at: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
      description: `Transaction ${i + 1} for wallet ${walletId || 'default'}`,
      from_account: {
        name: rwandaAccounts[Math.floor(Math.random() * rwandaAccounts.length)],
        type: 'individual'
      },
      to_account: {
        name: rwandaAccounts[Math.floor(Math.random() * rwandaAccounts.length)],
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
