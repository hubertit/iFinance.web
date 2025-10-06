import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: 'individual' | 'joint' | 'business';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  owners: string[];
  isDefault: boolean;
  description?: string;
  targetAmount?: number;
  targetDate?: Date;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private walletsSubject = new BehaviorSubject<Wallet[]>([]);
  private currentWalletSubject = new BehaviorSubject<Wallet | null>(null);

  public wallets$ = this.walletsSubject.asObservable();
  public currentWallet$ = this.currentWalletSubject.asObservable();

  constructor() {
    this.initializeMockWallets();
  }

  private initializeMockWallets(): void {
    const mockWallets: Wallet[] = [
      {
        id: 'WALLET-1',
        name: 'Main Wallet',
        balance: 250000,
        currency: 'RWF',
        type: 'individual',
        status: 'active',
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
        owners: ['You'],
        isDefault: true,
        avatar: 'wallet'
      },
      {
        id: 'WALLET-2',
        name: 'Joint Wallet',
        balance: 1200000,
        currency: 'RWF',
        type: 'joint',
        status: 'active',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        owners: ['You', 'Alice', 'Eric'],
        isDefault: false,
        description: 'Joint savings for family expenses',
        targetAmount: 2000000,
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
        avatar: 'users'
      },
      {
        id: 'WALLET-3',
        name: 'Vacation Fund',
        balance: 350000,
        currency: 'RWF',
        type: 'individual',
        status: 'inactive',
        createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days ago
        owners: ['You'],
        isDefault: false,
        description: 'Vacation savings',
        targetAmount: 500000,
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        avatar: 'piggy-bank'
      },
      {
        id: 'WALLET-4',
        name: 'Business Wallet',
        balance: 5000000,
        currency: 'RWF',
        type: 'business',
        status: 'active',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        owners: ['You', 'Business Partner'],
        isDefault: false,
        description: 'Business operations and expenses',
        avatar: 'briefcase'
      }
    ];

    this.walletsSubject.next(mockWallets);
    
    // Set the default wallet as current
    const defaultWallet = mockWallets.find(w => w.isDefault);
    if (defaultWallet) {
      this.currentWalletSubject.next(defaultWallet);
    }
  }

  getWallets(): Wallet[] {
    return this.walletsSubject.value;
  }

  getCurrentWallet(): Wallet | null {
    return this.currentWalletSubject.value;
  }

  switchWallet(walletId: string): void {
    const wallets = this.walletsSubject.value;
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
      this.currentWalletSubject.next(wallet);
    }
  }

  addWallet(wallet: Omit<Wallet, 'id' | 'createdAt'>): void {
    const newWallet: Wallet = {
      ...wallet,
      id: `WALLET-${Date.now()}`,
      createdAt: new Date()
    };

    const wallets = this.walletsSubject.value;
    this.walletsSubject.next([...wallets, newWallet]);
  }

  updateWallet(walletId: string, updates: Partial<Wallet>): void {
    const wallets = this.walletsSubject.value;
    const updatedWallets = wallets.map(w => 
      w.id === walletId ? { ...w, ...updates } : w
    );
    this.walletsSubject.next(updatedWallets);

    // Update current wallet if it's the one being updated
    const currentWallet = this.currentWalletSubject.value;
    if (currentWallet && currentWallet.id === walletId) {
      this.currentWalletSubject.next({ ...currentWallet, ...updates });
    }
  }

  deleteWallet(walletId: string): void {
    const wallets = this.walletsSubject.value;
    const updatedWallets = wallets.filter(w => w.id !== walletId);
    this.walletsSubject.next(updatedWallets);

    // If the deleted wallet was the current one, switch to default
    const currentWallet = this.currentWalletSubject.value;
    if (currentWallet && currentWallet.id === walletId) {
      const defaultWallet = updatedWallets.find(w => w.isDefault);
      this.currentWalletSubject.next(defaultWallet || updatedWallets[0] || null);
    }
  }

  formatBalance(balance: number, currency: string = 'RWF'): string {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(balance);
  }
}
