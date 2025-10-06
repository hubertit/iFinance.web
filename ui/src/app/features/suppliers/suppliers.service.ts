import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from './supplier.model';
import { ConfigService } from '../../core/services/config.service';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  getSuppliers(): Observable<any> {
    const token = localStorage.getItem('ifinance.token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    return this.http.post<any>(this.configService.getFullUrl('/suppliers/get.php'), {
      token: token
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  getSupplierById(id: string): Observable<any> {
    const token = localStorage.getItem('ifinance.token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    return this.http.post<any>(this.configService.getFullUrl('/suppliers/get.php'), {
      token: token,
      supplier_id: id
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  createSupplier(supplier: CreateSupplierRequest): Observable<any> {
    const token = localStorage.getItem('ifinance.token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    return this.http.post<any>(this.configService.getFullUrl('/suppliers/create.php'), {
      token: token,
      ...supplier
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  updateSupplier(id: string, supplier: UpdateSupplierRequest): Observable<any> {
    const token = localStorage.getItem('ifinance.token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    return this.http.post<any>(this.configService.getFullUrl('/suppliers/update.php'), {
      token: token,
      supplier_id: id,
      ...supplier
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  deleteSupplier(id: string): Observable<any> {
    const token = localStorage.getItem('ifinance.token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    return this.http.post<any>(this.configService.getFullUrl('/suppliers/delete.php'), {
      token: token,
      supplier_id: id
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  updateSupplierPrice(id: string, pricePerLiter: number): Observable<any> {
    const token = localStorage.getItem('ifinance.token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    return this.http.post<any>(this.configService.getFullUrl('/suppliers/update.php'), {
      token: token,
      supplier_id: id,
      sellingPricePerLiter: pricePerLiter
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
