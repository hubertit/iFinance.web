import { Injectable } from '@angular/core';
import { Observable, of, throwError, from, BehaviorSubject } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { MockCredentialsService } from './mock-credentials.service';

export interface User {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  accountType: string;
  accountCode?: string;
  accountName?: string;
  avatar?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  about?: string;
  address?: string;
  // KYC Fields
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  idNumber?: string;
  kycStatus?: string;
  // Additional fields from Flutter app
  token?: string;
  permissions?: { [key: string]: boolean };
  isAgentCandidate?: boolean;
}

export interface Account {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  account_status: string;
  account_created_at: string;
  role: string;
  permissions: { [key: string]: boolean };
  user_account_status: string;
  access_granted_at: string;
  is_default: boolean;
  avatar?: string;
}

export interface LoginResponse {
  user: User;
  account: Account;
  accounts: Account[];
  total_accounts: number;
  profile_completion: number;
}

// API Configuration - now using ConfigService

// Account Types matching Flutter app exactly
export const ACCOUNT_TYPES = {
  MCC: 'mcc',
  AGENT: 'agent', 
  COLLECTOR: 'collector',
  VETERINARIAN: 'veterinarian',
  SUPPLIER: 'supplier',
  CUSTOMER: 'customer',
  FARMER: 'farmer',
  OWNER: 'owner'
} as const;

export type AccountType = typeof ACCOUNT_TYPES[keyof typeof ACCOUNT_TYPES];

// Registration request interface matching Flutter app
export interface RegistrationRequest {
  name: string;
  account_name: string;
  email?: string;
  phone: string;
  password: string;
  nid?: string;
  role: string;
  account_type: string;
  permissions?: { [key: string]: boolean };
  is_agent_candidate?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;
  private currentAccount: Account | null = null;
  private availableAccounts: Account[] = [];
  
  // BehaviorSubject to track account changes
  private currentAccountSubject = new BehaviorSubject<Account | null>(null);
  public currentAccount$ = this.currentAccountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private mockCredentialsService: MockCredentialsService
  ) {
    // Check if user is already logged in
    const storedUser = localStorage.getItem(this.configService.userKey);
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    
    // Load account data from localStorage
    const storedAccount = localStorage.getItem('ifinance.currentAccount');
    if (storedAccount) {
      try {
        this.currentAccount = JSON.parse(storedAccount);
      } catch (e) {
        console.error('Error parsing stored account:', e);
      }
    }
    
    const storedAccounts = localStorage.getItem('ifinance.availableAccounts');
    if (storedAccounts) {
      try {
        this.availableAccounts = JSON.parse(storedAccounts);
      } catch (e) {
        console.error('Error parsing stored accounts:', e);
      }
    }
    
    // Initialize the BehaviorSubject with current account
    this.currentAccountSubject.next(this.currentAccount);
  }

  // Check if current user is a lender
  isLender(): boolean {
    return this.currentUser?.role === 'lender' || this.currentUser?.accountType === 'lender';
  }

  login(identifier: string, password: string): Observable<User> {
    console.log('🔧 AuthService: Attempting login with:', { identifier, password: '***' });

    // First, check if this is a mock credential
    const mockCredential = this.mockCredentialsService.validateCredentials(identifier, password);
    if (mockCredential) {
      console.log('🔧 AuthService: Using mock credentials for:', mockCredential.name);
      return this.handleMockLogin(mockCredential);
    }

    // If not mock credentials, try API login
    console.log('🔧 AuthService: Using API login');
    return this.handleApiLogin(identifier, password);
  }

  private handleMockLogin(mockCredential: any): Observable<User> {
    // Create user object from mock credential
    const userData: User = {
      id: mockCredential.role + '_' + Date.now(),
      name: mockCredential.name,
      email: mockCredential.email,
      phoneNumber: '+250788123456', // Default phone for mock users
      role: mockCredential.role,
      accountType: mockCredential.role,
      accountCode: mockCredential.role.toUpperCase() + '001',
      accountName: mockCredential.name,
      avatar: '/assets/img/user.png',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      isActive: true,
      about: mockCredential.description,
      address: 'Kigali, Rwanda',
      province: 'Kigali',
      district: 'Nyarugenge',
      sector: 'Kacyiru',
      cell: 'Kacyiru',
      village: 'Kacyiru',
      idNumber: '1234567890123456',
      kycStatus: 'verified',
      token: 'mock_token_' + Date.now(),
      permissions: this.getPermissionsForRole(mockCredential.role),
      isAgentCandidate: false
    };

    // Create mock account
    const mockAccount: Account = {
      account_id: 1,
      account_code: mockCredential.role.toUpperCase() + '001',
      account_name: mockCredential.name,
      account_type: mockCredential.role,
      account_status: 'active',
      account_created_at: new Date().toISOString(),
      role: mockCredential.role,
      permissions: this.getPermissionsForRole(mockCredential.role),
      user_account_status: 'active',
      access_granted_at: new Date().toISOString(),
      is_default: true,
      avatar: '/assets/img/user.png'
    };

    // Store user info and account data
    this.currentUser = userData;
    this.currentAccount = mockAccount;
    this.availableAccounts = [mockAccount];
    
    localStorage.setItem(this.configService.userKey, JSON.stringify(userData));
    localStorage.setItem(this.configService.tokenKey, userData.token || '');
    localStorage.setItem(this.configService.loginKey, 'true');
    localStorage.setItem('ifinance.currentAccount', JSON.stringify(mockAccount));
    localStorage.setItem('ifinance.availableAccounts', JSON.stringify([mockAccount]));
    localStorage.setItem('ifinance.profileCompletion', '100');
    
    // Emit the account change
    this.currentAccountSubject.next(mockAccount);
    
    return of(userData);
  }

  private handleApiLogin(identifier: string, password: string): Observable<User> {
    // Use identifier field as per API specification - matching Flutter app exactly
    const loginData = {
      identifier: identifier, // Can be email or phone
      password: password
    };

    console.log('🔧 AuthService: API URL:', this.configService.getAuthUrl('/login'));

    // Use fetch API to bypass CORS issues
    return from(fetch(this.configService.getAuthUrl('/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(loginData),
      mode: 'cors'
    }).then(response => {
      return response.json().then(data => {
        // Check if the API returned an error response
        if (data.code && data.status === 'error') {
          throw new Error(data.message || 'Login failed');
        }
        return data;
      });
    })).pipe(
      map((response: any) => {
        console.log('🔧 AuthService: Full API response:', response);
        console.log('🔧 AuthService: Response code:', response.code);
        console.log('🔧 AuthService: Response status:', response.status);
        
        // Handle the actual API response structure from curl test
        if (response.code === 200 && response.status === 'success') {
          const data = response.data;
          console.log('🔧 AuthService: Response data:', data);
          if (data) {
            const { user, account, accounts, total_accounts, profile_completion } = data;
            
            // Create user object matching the actual API response structure
            const userData: User = {
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              phoneNumber: user.phone,
              role: account?.type || user.account_type,
              accountType: account?.type || user.account_type || 'mcc',
              accountCode: account?.code,
              accountName: account?.name,
              avatar: user.profilePicture || user.profile_img,
              createdAt: new Date(),
              lastLoginAt: new Date(),
              isActive: user.status === 'active',
              about: user.about,
              address: user.address,
              province: user.province,
              district: user.district,
              sector: user.sector,
              cell: user.cell,
              village: user.village,
              idNumber: user.idNumber || user.id_number,
              kycStatus: user.kycStatus || user.kyc_status,
              token: user.token,
              permissions: user.permissions,
              isAgentCandidate: user.isAgentCandidate || false
            };

            // Store user info and account data - matching Flutter app storage keys
            this.currentUser = userData;
            this.currentAccount = account;
            
            // Filter out system accounts (matching mobile app behavior)
            const filteredAccounts = (accounts || []).filter((acc: Account) => 
              !acc.account_name.toLowerCase().includes('system')
            );
            this.availableAccounts = filteredAccounts;
            
            localStorage.setItem(this.configService.userKey, JSON.stringify(userData));
            localStorage.setItem(this.configService.tokenKey, userData.token || '');
            localStorage.setItem(this.configService.loginKey, 'true');
            localStorage.setItem('ifinance.currentAccount', JSON.stringify(account));
            localStorage.setItem('ifinance.availableAccounts', JSON.stringify(filteredAccounts));
            localStorage.setItem('ifinance.profileCompletion', profile_completion.toString());
            
            // Emit the account change
            this.currentAccountSubject.next(account);
            
            return userData;
          }
        }
        
        // Handle error responses (401, 400, etc.)
        if (response.code && response.status === 'error') {
          throw new Error(response.message || 'Login failed');
        }
        
        // Fallback for unexpected response structure
        throw new Error('Unexpected response format');
      }),
      catchError(error => {
        console.error('🔧 AuthService: Login error:', error);
        console.error('🔧 AuthService: Error message:', error.message);
        
        // Handle fetch API errors properly
        if (error.message) {
          return throwError(() => error.message);
        }
        
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          return throwError(() => 'Please check your internet connection and try again.');
        }
        
        // Fallback error message
        return throwError(() => 'An unexpected error occurred. Please try again.');
      })
    );
  }

  private getAvatarForRole(role: string): string {
    // Return realistic person avatars instead of role-based icons
    const avatarMap: { [key: string]: string } = {
      'lender': '/assets/img/user.png',
      'customer': '/assets/img/user.png',
      'admin': '/assets/img/user.png',
      'agent': '/assets/img/user.png',
      'partner': '/assets/img/user.png',
      'insurer': '/assets/img/user.png'
    };
    return avatarMap[role] || '/assets/img/user.png';
  }

  private getPermissionsForRole(role: string): { [key: string]: boolean } {
    const permissionMap: { [key: string]: { [key: string]: boolean } } = {
      'lender': {
        'view_applications': true,
        'approve_loans': true,
        'manage_products': true,
        'view_analytics': true,
        'disburse_loans': true
      },
      'customer': {
        'apply_loans': true,
        'view_loans': true,
        'make_payments': true,
        'view_transactions': true
      },
      'admin': {
        'manage_users': true,
        'system_config': true,
        'view_all_data': true,
        'manage_roles': true
      }
    };
    return permissionMap[role] || {};
  }

  logout(): Observable<any> {
    return this.http.post(this.configService.getAuthUrl('/logout'), {}).pipe(
      map(() => {
        this.clearLocalData();
      }),
      catchError(() => {
        // Even if logout fails, clear local data - matching Flutter app behavior
        this.clearLocalData();
        return of(null);
      })
    );
  }

  private clearLocalData(): void {
    this.currentUser = null;
    this.currentAccount = null;
    this.availableAccounts = [];
    localStorage.removeItem(this.configService.userKey);
    localStorage.removeItem(this.configService.tokenKey);
    localStorage.removeItem(this.configService.loginKey);
    localStorage.removeItem('ifinance.currentAccount');
    localStorage.removeItem('ifinance.availableAccounts');
    localStorage.removeItem('ifinance.profileCompletion');
  }

  isLoggedIn(): boolean {
    // Check localStorage to get the latest login state
    const loginKey = localStorage.getItem(this.configService.loginKey);
    const storedUser = localStorage.getItem(this.configService.userKey);
    
    if (loginKey === 'true' && storedUser) {
      // Also update currentUser from localStorage
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
      return !!this.currentUser;
    }
    
    return !!this.currentUser;
  }

  getCurrentUser(): User | null {
    // Always check localStorage to get the latest user data
    // This ensures we pick up changes immediately after login
    const storedUser = localStorage.getItem(this.configService.userKey);
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    return this.currentUser;
  }

  getToken(): string | null {
    return localStorage.getItem(this.configService.tokenKey);
  }

  getUserRole(): string {
    return this.currentUser?.role || '';
  }

  register(userData: any): Observable<User> {
    // Transform userData to match Flutter app's RegistrationRequest structure
    const registrationRequest: RegistrationRequest = {
      name: userData.name,
      account_name: userData.accountName,
      email: userData.email,
      phone: userData.phoneNumber,
      password: userData.password,
      nid: userData.idNumber,
      role: userData.accountType,
      account_type: userData.accountType,
      permissions: userData.permissions || {},
      is_agent_candidate: userData.isAgentCandidate || false
    };

    return this.http.post<any>(this.configService.getAuthUrl('/register'), registrationRequest).pipe(
      map(response => {
        // Handle response structure matching Flutter app
        if (response.statusCode === 200 || response.statusCode === 201) {
          const data = response.data;
          if (data) {
            const { user, account, token } = data;
            
            const newUser: User = {
              id: user.id,
              name: user.name,
              email: user.email,
              phoneNumber: user.phoneNumber || user.phone,
              role: account?.type || user.role,
              accountType: account?.type || user.accountType || 'mcc',
              accountCode: account?.code,
              accountName: account?.name,
              avatar: user.profilePicture || user.profile_img,
              createdAt: new Date(user.createdAt || user.created_at),
              isActive: user.isActive !== false,
              about: user.about,
              address: user.address,
              province: user.province,
              district: user.district,
              sector: user.sector,
              cell: user.cell,
              village: user.village,
              idNumber: user.idNumber || user.id_number,
              kycStatus: user.kycStatus || user.kyc_status,
              token: user.token || token,
              permissions: user.permissions,
              isAgentCandidate: user.isAgentCandidate || false
            };

            // Store user info - matching Flutter app storage keys
            this.currentUser = newUser;
            localStorage.setItem(this.configService.userKey, JSON.stringify(newUser));
            localStorage.setItem(this.configService.tokenKey, newUser.token || token);
            localStorage.setItem(this.configService.loginKey, 'true');
            
            return newUser;
          }
        }
        throw new Error(response.message || 'Registration failed');
      }),
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => this.handleHttpError(error));
      })
    );
  }

  requestPasswordReset(email: string): Observable<any> {
    // Matching Flutter app's requestPasswordReset method
    const data: any = {};
    if (email && email.trim() !== '') {
      data.email = email;
    }

    return this.http.post(this.configService.getAuthUrl('/request_reset.php'), data).pipe(
      map(response => response),
      catchError(error => {
        console.error('Password reset request error:', error);
        return throwError(() => this.handleHttpError(error));
      })
    );
  }

  resetPassword(userId: number, resetCode: string, newPassword: string): Observable<any> {
    // Matching Flutter app's resetPasswordWithCode method
    return this.http.post(this.configService.getAuthUrl('/reset_password.php'), {
      user_id: userId,
      reset_code: resetCode,
      new_password: newPassword
    }).pipe(
      map(response => response),
      catchError(error => {
        console.error('Password reset error:', error);
        return throwError(() => this.handleHttpError(error));
      })
    );
  }

  private handleHttpError(error: HttpErrorResponse): string {
    // Error handling matching Flutter app's _handleDioError method
    if (error.status === 0) {
      return 'Please check your internet connection and try again.';
    }
    
    switch (error.status) {
      case 400:
        return `Bad request: ${error.error?.message || 'Invalid request'}`;
      case 401:
        return 'Authentication failed. Please try again.';
      case 403:
        return `Access denied: ${error.error?.message || 'Insufficient permissions'}`;
      case 404:
        return `Resource not found: ${error.error?.message || 'Requested resource not found'}`;
      case 422:
        return `Validation error: ${error.error?.message || 'Please check your input'}`;
      case 500:
        return 'Something went wrong. Please try again later.';
      default:
        return `Error ${error.status}: ${error.error?.message || 'An unexpected error occurred'}`;
    }
  }

  getProfile(): Observable<User> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => 'No authentication token found');
    }

    // Matching Flutter app's getProfile method - using POST with token in body
    return this.http.post<any>(this.configService.getProfileUrl('/get.php'), { token }).pipe(
      map(response => {
        if (response.statusCode === 200 && response.data) {
          const user = response.data.user;
          const userData: User = {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber || user.phone,
            role: user.role,
            accountType: user.accountType || user.account_type,
            accountCode: user.accountCode || user.account_code,
            accountName: user.accountName || user.account_name,
            avatar: user.profilePicture || user.profile_img,
            createdAt: new Date(user.createdAt || user.created_at),
            lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined,
            isActive: user.isActive !== false,
            about: user.about,
            address: user.address,
            province: user.province,
            district: user.district,
            sector: user.sector,
            cell: user.cell,
            village: user.village,
            idNumber: user.idNumber || user.id_number,
            kycStatus: user.kycStatus || user.kyc_status,
            token: user.token,
            permissions: user.permissions,
            isAgentCandidate: user.isAgentCandidate
          };

          // Update cached user data
          this.currentUser = userData;
          localStorage.setItem(this.configService.userKey, JSON.stringify(userData));
          return userData;
        } else {
          throw new Error(response.message || 'Failed to fetch profile');
        }
      }),
      catchError(error => {
        console.error('Profile fetch error:', error);
        // If API call fails, try to get from cache as fallback - matching Flutter app
        const cachedUserData = localStorage.getItem(this.configService.userKey);
        if (cachedUserData) {
          const userData = JSON.parse(cachedUserData);
          this.currentUser = userData;
          return of(userData);
        }
        return throwError(() => this.handleHttpError(error));
      })
    );
  }

  updateProfile(profileData: Partial<User>): Observable<User> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => 'No authentication token found');
    }

    // Matching Flutter app's updateProfile method - using POST with token in body
    const body = {
      token: token,
      ...profileData
    };

    return this.http.post<any>(this.configService.getProfileUrl('/update.php'), body).pipe(
      map(response => {
        if (response.statusCode === 200 && response.data) {
          const updatedUser = response.data.user;
          const userData: User = {
            ...this.currentUser!,
            ...updatedUser,
            id: updatedUser.id || this.currentUser!.id,
            createdAt: updatedUser.createdAt ? new Date(updatedUser.createdAt) : this.currentUser!.createdAt
          };

          // Update cached user data
          this.currentUser = userData;
          localStorage.setItem(this.configService.userKey, JSON.stringify(userData));
          return userData;
        } else {
          throw new Error(response.message || 'Profile update failed');
        }
      }),
      catchError(error => {
        console.error('Profile update error:', error);
        return throwError(() => this.handleHttpError(error));
      })
    );
  }

  validatePassword(password: string): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => 'No authentication token found');
    }

    return this.http.post<any>(this.configService.getAuthUrl('/validate-password'), { password }, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map(response => response.success && response.data?.valid === true),
      catchError(() => of(false))
    );
  }

  // Multi-account switching methods
  getCurrentAccount(): Account | null {
    return this.currentAccount;
  }

  getAvailableAccounts(): Account[] {
    return this.availableAccounts;
  }

  // Fetch all available accounts from API (matching mobile app behavior)
  fetchUserAccounts(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => 'No authentication token found');
    }

    return this.http.post<any>(this.configService.getFullUrl('/accounts/get'), {
      token: token
    }).pipe(
      map(response => {
        if (response.code === 200 && response.data) {
          const { accounts } = response.data;
          
          // Filter out system accounts (matching mobile app behavior)
          const filteredAccounts = (accounts || []).filter((account: Account) => 
            !account.account_name.toLowerCase().includes('system')
          );
          
          this.availableAccounts = filteredAccounts;
          
          // Update current account if it's not set or if the default account changed
          const defaultAccount = filteredAccounts.find((acc: Account) => acc.is_default);
          if (defaultAccount && (!this.currentAccount || this.currentAccount.account_id !== defaultAccount.account_id)) {
            this.currentAccount = defaultAccount;
            localStorage.setItem('ifinance.currentAccount', JSON.stringify(defaultAccount));
          }
          
          localStorage.setItem('ifinance.availableAccounts', JSON.stringify(filteredAccounts));
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch accounts');
      }),
      catchError(error => {
        console.error('Failed to fetch user accounts:', error);
        return throwError(() => this.handleHttpError(error));
      })
    );
  }

  // Switch account using API (matching mobile app behavior)
  switchAccount(account: Account): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => 'No authentication token found');
    }

    return this.http.post<any>(this.configService.getFullUrl('/accounts/switch'), {
      token: token,
      account_id: account.account_id
    }).pipe(
      map(response => {
        if (response.code === 200 && response.data) {
          const { account: newAccount, accounts } = response.data;
          
          // Filter out system accounts (matching mobile app behavior)
          const filteredAccounts = (accounts || []).filter((acc: Account) => 
            !acc.account_name.toLowerCase().includes('system')
          );
          
          // Update current account and available accounts
          this.currentAccount = newAccount;
          this.availableAccounts = filteredAccounts;
          
          // Update user data with new account context
          if (this.currentUser) {
            this.currentUser.role = newAccount.role;
            this.currentUser.accountType = newAccount.account_type;
            this.currentUser.accountCode = newAccount.account_code;
            this.currentUser.accountName = newAccount.account_name;
            this.currentUser.permissions = newAccount.permissions;
            
            localStorage.setItem(this.configService.userKey, JSON.stringify(this.currentUser));
          }
          
          // Update localStorage
          localStorage.setItem('ifinance.currentAccount', JSON.stringify(newAccount));
          localStorage.setItem('ifinance.availableAccounts', JSON.stringify(filteredAccounts));
          
          // Emit the account change
          this.currentAccountSubject.next(newAccount);
          
          console.log('🔧 AuthService: Account switched to:', newAccount.account_name);
          return response.data;
        }
        throw new Error(response.message || 'Failed to switch account');
      }),
      catchError(error => {
        console.error('Failed to switch account:', error);
        return throwError(() => this.handleHttpError(error));
      })
    );
  }

  getProfileCompletion(): number {
    const completion = localStorage.getItem('ifinance.profileCompletion');
    return completion ? parseInt(completion, 10) : 0;
  }

  hasMultipleAccounts(): boolean {
    return this.availableAccounts.length > 1;
  }

  getDefaultAccount(): Account | null {
    return this.availableAccounts.find(account => account.is_default) || null;
  }

  getAccountById(accountId: number): Account | null {
    return this.availableAccounts.find(account => account.account_id === accountId) || null;
  }
}