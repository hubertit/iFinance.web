import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CorsProxyService {

  login(identifier: string, password: string): Observable<any> {
    return new Observable(observer => {
      const loginData = {
        identifier: identifier,
        password: password
      };

      console.log('🔧 CorsProxyService: Attempting login with:', { identifier, password: '***' });
      console.log('🔧 CorsProxyService: Using CORS proxy...');

      // Use a public CORS proxy service for development
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/https://api.gemura.rw/v2/auth/login';
      
      fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(loginData)
      })
      .then(response => {
        console.log('🔧 CorsProxyService: Response status:', response.status);
        console.log('🔧 CorsProxyService: Response headers:', response.headers);
        
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      })
      .then(data => {
        console.log('🔧 CorsProxyService: Response data:', data);
        observer.next(data);
        observer.complete();
      })
      .catch(error => {
        console.error('🔧 CorsProxyService: Fetch error:', error);
        observer.error(error);
      });
    });
  }
}
