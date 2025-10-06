import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfigService } from '../../core/services/config.service';
import { AuthService } from '../../core/services/auth.service';
import { Collection, CreateCollectionRequest, UpdateCollectionRequest, ApproveCollectionRequest, RejectCollectionRequest } from './collection.model';

@Injectable({
  providedIn: 'root'
})
export class CollectionsService {
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
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors
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

  getCollections(): Observable<Collection[]> {
    const token = this.getAuthToken();
    return this.http.post<any>(this.configService.getFullUrl('/collections/get'), { token }).pipe(
      map(response => {
        // Handle both array response and object with data property
        const collectionsData = Array.isArray(response) ? response : (response.data || []);
        return (collectionsData || []).map((json: any) => this.mapToCollection(json));
      }),
      catchError(this.handleError)
    );
  }

  getFilteredCollections(filters: any): Observable<Collection[]> {
    const token = this.getAuthToken();
    const requestData = {
      token,
      filters: {
        ...filters,
        date_from: filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : undefined,
        date_to: filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : undefined,
      }
    };
    return this.http.post<any>(this.configService.getFullUrl('/collections/get'), requestData).pipe(
      map(response => {
        const collectionsData = Array.isArray(response) ? response : (response.data || []);
        return (collectionsData || []).map((json: any) => this.mapToCollection(json));
      }),
      catchError(this.handleError)
    );
  }

  createCollection(collection: CreateCollectionRequest): Observable<any> {
    const token = this.getAuthToken();
    const requestData = {
      token,
      supplier_account_code: collection.supplierAccountCode,
      quantity: collection.quantity,
      status: collection.status,
      collection_at: collection.collectionAt.toISOString().replace('T', ' ').substring(0, 19),
      notes: collection.notes,
    };
    return this.http.post<any>(this.configService.getFullUrl('/collections/create'), requestData).pipe(
      catchError(this.handleError)
    );
  }

  updateCollection(updateRequest: UpdateCollectionRequest): Observable<any> {
    const token = this.getAuthToken();
    const requestData: any = {
      token,
      collection_id: updateRequest.collectionId,
    };
    if (updateRequest.quantity !== undefined) requestData.quantity = updateRequest.quantity;
    if (updateRequest.pricePerLiter !== undefined) requestData.unit_price = updateRequest.pricePerLiter;
    if (updateRequest.status !== undefined) requestData.status = updateRequest.status;
    if (updateRequest.collectionAt !== undefined) requestData.collection_at = updateRequest.collectionAt.toISOString().replace('T', ' ').substring(0, 19);
    if (updateRequest.notes !== undefined) requestData.notes = updateRequest.notes;

    return this.http.post<any>(this.configService.getFullUrl('/collections/update'), requestData).pipe(
      catchError(this.handleError)
    );
  }

  cancelCollection(collectionId: string): Observable<any> {
    const token = this.getAuthToken();
    return this.http.post<any>(this.configService.getFullUrl('/collections/cancel'), { token, collection_id: collectionId }).pipe(
      catchError(this.handleError)
    );
  }

  deleteCollection(collectionId: string): Observable<any> {
    const token = this.getAuthToken();
    return this.http.post<any>(this.configService.getFullUrl('/collections/delete'), { token, collection_id: collectionId }).pipe(
      catchError(this.handleError)
    );
  }

  approveCollection(approveRequest: ApproveCollectionRequest): Observable<any> {
    const token = this.getAuthToken();
    return this.http.post<any>(this.configService.getFullUrl('/collections/approve'), {
      token,
      collection_id: approveRequest.collectionId,
      notes: approveRequest.notes,
    }).pipe(
      catchError(this.handleError)
    );
  }

  rejectCollection(rejectRequest: RejectCollectionRequest): Observable<any> {
    const token = this.getAuthToken();
    return this.http.post<any>(this.configService.getFullUrl('/collections/reject'), {
      token,
      collection_id: rejectRequest.collectionId,
      rejection_reason: rejectRequest.rejectionReason,
      notes: rejectRequest.notes,
    }).pipe(
      catchError(this.handleError)
    );
  }

  getCollectionStats(): Observable<any> {
    const token = this.getAuthToken();
    return this.http.post<any>(this.configService.getFullUrl('/collections/stats'), { token }).pipe(
      map(response => {
        if (response.code === 200 || response.status === 'success') {
          return response.data || {};
        } else {
          throw new Error(response.message || 'Failed to get collection stats');
        }
      }),
      catchError(this.handleError)
    );
  }

  private mapToCollection(json: any): Collection {
    const supplierAccount = json['supplier_account'] as any;
    return {
      id: json['id']?.toString() ?? '',
      supplierId: supplierAccount?.code?.toString() ?? json['supplier_account_code']?.toString() ?? '',
      supplierName: supplierAccount?.name?.toString() ?? json['supplier_name']?.toString() ?? '',
      supplierPhone: json['supplier_phone']?.toString() ?? '', // Assuming this comes from API or needs to be fetched
      quantity: parseFloat(json['quantity']?.toString() ?? '0'),
      pricePerLiter: parseFloat(json['unit_price']?.toString() ?? '0'),
      totalValue: parseFloat(json['total_amount']?.toString() ?? '0'),
      status: json['status']?.toString() as 'pending' | 'accepted' | 'rejected' | 'cancelled' ?? 'pending',
      rejectionReason: json['rejection_reason']?.toString(),
      quality: json['quality']?.toString(),
      notes: json['notes']?.toString(),
      collectionDate: new Date(json['collection_at'] ?? Date.now()),
      createdAt: new Date(json['created_at'] ?? Date.now()),
      updatedAt: new Date(json['updated_at'] ?? Date.now()),
    };
  }
}