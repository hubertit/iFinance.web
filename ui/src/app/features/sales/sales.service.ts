import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfigService } from '../../core/services/config.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Sale,
  CreateSaleRequest,
  UpdateSaleRequest,
  CancelSaleRequest,
  SaleStats
} from './sale.model';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  private getAuthToken(): string {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 404) {
        errorMessage = 'API endpoint not found.';
      } else if (error.error && error.error.message) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  getSales(): Observable<Sale[]> {
    const token = this.getAuthToken();
    return this.http.post<any>(this.configService.getFullUrl('/sales/sales'), { token }).pipe(
      map(response => {
        if (response.code === 200 || response.status === 'success') {
          const salesData = response.data && response.data.sales ? response.data.sales : response.data;
          return (salesData || []).map((json: any) => this.mapToSale(json));
        } else {
          throw new Error(response.message || 'Failed to get sales');
        }
      }),
      catchError(this.handleError)
    );
  }

  getFilteredSales(filters: any): Observable<Sale[]> {
    const token = this.getAuthToken();
    const requestData = {
      token,
      filters: {
        ...filters,
        date_from: filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : undefined,
        date_to: filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : undefined,
      }
    };
    return this.http.post<any>(this.configService.getFullUrl('/sales/sales'), requestData).pipe(
      map(response => {
        if (response.code === 200 || response.status === 'success') {
          const salesData = response.data && response.data.sales ? response.data.sales : response.data;
          return (salesData || []).map((json: any) => this.mapToSale(json));
        } else {
          throw new Error(response.message || 'Failed to get filtered sales');
        }
      }),
      catchError(this.handleError)
    );
  }

  createSale(sale: CreateSaleRequest): Observable<any> {
    const token = this.getAuthToken();
    const requestData = {
      token,
      customer_account_code: sale.customerAccountCode,
      quantity: sale.quantity,
      status: sale.status,
      sale_at: sale.saleAt.toISOString().replace('T', ' ').substring(0, 19),
      notes: sale.notes,
    };
    return this.http.post<any>(this.configService.getFullUrl('/sales/sell'), requestData).pipe(
      catchError(this.handleError)
    );
  }

  updateSale(updateRequest: UpdateSaleRequest): Observable<any> {
    const token = this.getAuthToken();
    const requestData: any = {
      token,
      sale_id: updateRequest.saleId,
    };
    if (updateRequest.customerAccountCode !== undefined) requestData.customer_account_code = updateRequest.customerAccountCode;
    if (updateRequest.quantity !== undefined) requestData.quantity = updateRequest.quantity;
    if (updateRequest.pricePerLiter !== undefined) requestData.unit_price = updateRequest.pricePerLiter;
    if (updateRequest.status !== undefined) requestData.status = updateRequest.status;
    if (updateRequest.saleAt !== undefined) requestData.sale_at = updateRequest.saleAt.toISOString().replace('T', ' ').substring(0, 19);
    if (updateRequest.notes !== undefined) requestData.notes = updateRequest.notes;

    return this.http.post<any>(this.configService.getFullUrl('/sales/update'), requestData).pipe(
      catchError(this.handleError)
    );
  }

  cancelSale(saleId: string): Observable<any> {
    const token = this.getAuthToken();
    return this.http.post<any>(this.configService.getFullUrl('/sales/cancel'), { token, sale_id: saleId }).pipe(
      catchError(this.handleError)
    );
  }

  getSaleStats(): Observable<SaleStats> {
    const token = this.getAuthToken();
    return this.http.post<any>(this.configService.getFullUrl('/sales/stats'), { token }).pipe(
      map(response => {
        if (response.code === 200 || response.status === 'success') {
          return response.data || {};
        } else {
          throw new Error(response.message || 'Failed to get sale stats');
        }
      }),
      catchError(this.handleError)
    );
  }

  private mapToSale(json: any): Sale {
    const customerAccount = json['customer_account'] as any;
    return {
      id: json['id']?.toString() ?? '',
      customerId: customerAccount?.code?.toString() ?? json['customer_account_code']?.toString() ?? '',
      customerName: customerAccount?.name?.toString() ?? json['customer_name']?.toString() ?? '',
      customerPhone: json['customer_phone']?.toString() ?? '',
      quantity: parseFloat(json['quantity']?.toString() ?? '0'),
      pricePerLiter: parseFloat(json['unit_price']?.toString() ?? '0'),
      totalValue: parseFloat(json['total_amount']?.toString() ?? '0'),
      status: json['status']?.toString() as 'pending' | 'accepted' | 'rejected' | 'cancelled' ?? 'pending',
      rejectionReason: json['rejection_reason']?.toString(),
      notes: json['notes']?.toString(),
      saleAt: new Date(json['sale_at'] ?? Date.now()),
      createdAt: new Date(json['created_at'] ?? Date.now()),
      updatedAt: new Date(json['updated_at'] ?? Date.now()),
    };
  }
}
