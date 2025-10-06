import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://api.gemura.rw/v2';
  private token: string | null = null;

  constructor(private http: HttpClient) {
    this.loadToken();
  }

  private loadToken() {
    this.token = localStorage.getItem('ifinance.token');
  }

  private getHeaders(): HttpHeaders {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });

    if (this.token) {
      return headers.set('Authorization', `Bearer ${this.token}`);
    }

    return headers;
  }

  // Generic HTTP methods
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    // For customers/get endpoint, send only token in body
    let requestData;
    if (endpoint === '/customers/get') {
      requestData = {
        token: this.token
      };
    } else {
      // For other endpoints, merge data with token
      requestData = {
        ...data,
        token: this.token
      };
    }
    
    console.log('API Request:', {
      url: `${this.baseUrl}${endpoint}`,
      data: requestData,
      headers: this.getHeaders()
    });
    
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, requestData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
        // Clear token and redirect to login
        localStorage.removeItem('auth_token');
        window.location.href = '/auth/login';
      } else if (error.status === 404) {
        errorMessage = 'Service not found.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.error?.message || `Error Code: ${error.status}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Set token method
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('ifinance.token', token);
    console.log('Token set:', token);
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Clear token method
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }
}
