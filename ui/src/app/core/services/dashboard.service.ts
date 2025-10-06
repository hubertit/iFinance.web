import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

export interface DashboardOverview {
  summary: {
    collection: {
      liters: number;
      value: number;
      transactions: number;
    };
    sales: {
      liters: number;
      value: number;
      transactions: number;
    };
    suppliers: {
      active: number;
      inactive: number;
    };
    customers: {
      active: number;
      inactive: number;
    };
  };
  breakdown_type: string;
  chart_period?: string;
  breakdown: Array<{
    label: string;
    month?: string;
    date?: string;
    collection: {
      liters: number;
      value: number;
    };
    sales: {
      liters: number;
      value: number;
    };
  }>;
  recent_transactions?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    type: string;
    status: string;
    transaction_at: string;
    created_at: string;
    supplier_account?: {
      name: string;
      code: string;
    };
    customer_account?: {
      name: string;
      code: string;
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
    const token = localStorage.getItem(this.configService.tokenKey);
    if (!token) {
      return throwError(() => 'No authentication token found');
    }

    const requestData: any = { token };
    if (dateFrom) requestData.date_from = dateFrom;
    if (dateTo) requestData.date_to = dateTo;

    return this.http.post<any>(this.configService.getFullUrl('/stats/overview'), requestData).pipe(
      map(response => {
        if (response.code === 200 && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to get overview data');
      }),
      catchError(error => {
        console.error('Failed to get overview data:', error);
        return throwError(() => this.handleHttpError(error));
      })
    );
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
