import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthFetchService {

  login(identifier: string, password: string): Observable<any> {
    return new Observable(observer => {
      const loginData = {
        identifier: identifier,
        password: password
      };

      console.log('🔧 AuthFetchService: Attempting login with:', { identifier, password: '***' });
      console.log('🔧 AuthFetchService: API URL:', 'https://api.gemura.rw/v2/auth/login');

      fetch('https://api.gemura.rw/v2/auth/login', {
        method: 'POST',
        mode: 'cors', // This might help with CORS
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginData)
      })
      .then(response => {
        console.log('🔧 AuthFetchService: Response status:', response.status);
        console.log('🔧 AuthFetchService: Response headers:', response.headers);
        
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      })
      .then(data => {
        console.log('🔧 AuthFetchService: Response data:', data);
        observer.next(data);
        observer.complete();
      })
      .catch(error => {
        console.error('🔧 AuthFetchService: Fetch error:', error);
        observer.error(error);
      });
    });
  }
}
