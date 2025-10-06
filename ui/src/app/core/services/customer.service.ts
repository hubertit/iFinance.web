import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from './api.service';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  location: string;
  gpsCoordinates?: string;
  businessType: string;
  customerType: string; // Individual, Restaurant, Shop, etc.
  buyingPricePerLiter: number;
  paymentMethod: string;
  bankAccount?: string;
  mobileMoneyNumber?: string;
  idNumber?: string;
  notes?: string;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  // Additional fields for UI compatibility
  address?: string;
  city?: string;
  region?: string;
  status?: 'Active' | 'Inactive' | 'Suspended';
  registrationDate?: Date;
  lastPurchaseDate?: Date;
  totalPurchases?: number;
  totalAmount?: number;
  preferredDeliveryTime?: string;
  avatar?: string;
  pricePerLiter?: number;
  relationshipId?: string;
  averageSupplyQuantity?: number;
  relationshipStatus?: string;
  userCode?: string;
  accountCode?: string;
  accountName?: string;
}

export interface MilkSale {
  id: string;
  customerId: string;
  customerName: string;
  date: Date;
  quantity: number; // in liters
  pricePerLiter: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Credit';
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  deliveryMethod: 'Pickup' | 'Delivery';
  deliveryAddress?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private customers: Customer[] = [];
  private milkSales: MilkSale[] = [];

  constructor(private apiService: ApiService) {
    // Load token from localStorage if it exists
    const storedToken = localStorage.getItem('ifinance.token');
    if (storedToken) {
      this.apiService.setToken(storedToken);
      // Load initial data from API
      this.loadCustomersFromAPI();
    } else {
      // Fallback to mock data if no token
      this.loadMockData();
    }
  }

  // Debug method to set a test token
  setTestToken(token: string) {
    this.apiService.setToken(token);
    console.log('Test token set, reloading customers...');
    this.loadCustomersFromAPI();
  }

  // Method to reload customers from API (useful after login)
  reloadCustomers() {
    const storedToken = localStorage.getItem('ifinance.token');
    if (storedToken) {
      this.apiService.setToken(storedToken);
      this.loadCustomersFromAPI();
    }
  }

  // Customer methods
  getCustomers(): Customer[] {
    return this.customers;
  }

  getCustomersFromAPI(): Observable<any> {
    return this.apiService.post<any>('/customers/get', {});
  }

  getCustomerById(id: string): Customer | undefined {
    return this.customers.find(customer => customer.id === id);
  }

  addCustomer(customerData: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    pricePerLiter: number;
    customerType?: string;
    businessType?: string;
    paymentMethod?: string;
    location?: string;
    notes?: string;
  }): Observable<any> {
    return this.apiService.post('/customers/create', {
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email,
      address: customerData.address,
      price_per_liter: customerData.pricePerLiter,
      customer_type: customerData.customerType || 'Individual',
      business_type: customerData.businessType || 'Retail',
      payment_method: customerData.paymentMethod || 'Cash',
      location: customerData.location || customerData.address,
      notes: customerData.notes
    });
  }

  updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const index = this.customers.findIndex(customer => customer.id === id);
    if (index !== -1) {
      this.customers[index] = { ...this.customers[index], ...updates };
      return this.customers[index];
    }
    return null;
  }

  updateCustomerAPI(relationshipId: string, pricePerLiter: number): Observable<any> {
    return this.apiService.post('/customers/update', {
      relation_id: relationshipId,
      price_per_liter: pricePerLiter
    });
  }

  deleteCustomer(id: string): boolean {
    const index = this.customers.findIndex(customer => customer.id === id);
    if (index !== -1) {
      this.customers.splice(index, 1);
      return true;
    }
    return false;
  }

  deleteCustomerAPI(relationshipId: string): Observable<any> {
    return this.apiService.post('/customers/delete', {
      relationship_id: relationshipId
    });
  }

  // Milk sales methods
  getMilkSales(): MilkSale[] {
    return this.milkSales;
  }

  getMilkSalesByCustomer(customerId: string): MilkSale[] {
    return this.milkSales.filter(sale => sale.customerId === customerId);
  }

  addMilkSale(sale: Omit<MilkSale, 'id'>): MilkSale {
    const newSale: MilkSale = {
      ...sale,
      id: this.generateId()
    };
    this.milkSales.push(newSale);
    
    // Update customer stats
    const customer = this.getCustomerById(sale.customerId);
    if (customer) {
      customer.totalPurchases = (customer.totalPurchases || 0) + 1;
      customer.totalAmount = (customer.totalAmount || 0) + sale.totalAmount;
      customer.lastPurchaseDate = sale.date;
    }
    
    return newSale;
  }

  updateMilkSale(id: string, updates: Partial<MilkSale>): MilkSale | null {
    const index = this.milkSales.findIndex(sale => sale.id === id);
    if (index !== -1) {
      this.milkSales[index] = { ...this.milkSales[index], ...updates };
      return this.milkSales[index];
    }
    return null;
  }

  deleteMilkSale(id: string): boolean {
    const index = this.milkSales.findIndex(sale => sale.id === id);
    if (index !== -1) {
      this.milkSales.splice(index, 1);
      return true;
    }
    return false;
  }

  // Statistics
  getCustomerStats() {
    const totalCustomers = this.customers.length;
    const activeCustomers = this.customers.filter(c => c.status === 'Active').length;
    const totalSales = this.milkSales.length;
    const totalRevenue = this.milkSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      totalCustomers,
      activeCustomers,
      totalSales,
      totalRevenue,
      averageOrderValue
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private loadCustomersFromAPI() {
    console.log('Loading customers from API...');
    this.getCustomersFromAPI().subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
        if (response.code === 200 || response.status === 'success') {
          this.customers = this.transformApiCustomers(response.data || []);
          console.log('Transformed customers:', this.customers);
        } else {
          console.error('API returned error:', response);
          this.loadMockData();
        }
      },
      error: (error) => {
        console.error('Failed to load customers from API:', error);
        // Fallback to mock data if API fails
        this.loadMockData();
      }
    });
  }

  private transformApiCustomers(apiCustomers: any[]): Customer[] {
    return apiCustomers.map(apiCustomer => ({
      id: apiCustomer.relationship_id || apiCustomer.id,
      name: apiCustomer.name,
      phone: apiCustomer.phone,
      email: apiCustomer.email || '',
      location: apiCustomer.address || apiCustomer.location || '',
      gpsCoordinates: apiCustomer.gps_coordinates,
      businessType: apiCustomer.business_type || 'Retail',
      customerType: apiCustomer.customer_type || 'Individual',
      buyingPricePerLiter: parseFloat(apiCustomer.price_per_liter) || 0,
      paymentMethod: apiCustomer.payment_method || 'Cash',
      bankAccount: apiCustomer.bank_account,
      mobileMoneyNumber: apiCustomer.mobile_money_number,
      idNumber: apiCustomer.id_number,
      notes: apiCustomer.notes || '',
      profilePhoto: apiCustomer.profile_photo || 'assets/img/user.png',
      createdAt: apiCustomer.created_at || new Date().toISOString(),
      updatedAt: apiCustomer.updated_at || new Date().toISOString(),
      isActive: apiCustomer.is_active !== false,
      // Additional fields for UI compatibility
      address: apiCustomer.address || '',
      city: apiCustomer.city || 'Kigali',
      region: apiCustomer.region || 'Kigali',
      status: this.mapStatus(apiCustomer.relationship_status || 'active'),
      registrationDate: new Date(apiCustomer.created_at || new Date()),
      lastPurchaseDate: undefined,
      totalPurchases: 0,
      totalAmount: 0,
      preferredDeliveryTime: 'Morning (8:00-10:00)',
      avatar: apiCustomer.profile_photo || 'assets/img/user.png',
      pricePerLiter: parseFloat(apiCustomer.price_per_liter) || 0,
      relationshipId: apiCustomer.relationship_id,
      averageSupplyQuantity: parseFloat(apiCustomer.average_supply_quantity) || 0,
      relationshipStatus: apiCustomer.relationship_status,
      userCode: apiCustomer.code,
      accountCode: apiCustomer.account?.code,
      accountName: apiCustomer.account?.name
    }));
  }

  private mapCustomerType(type: string): 'Individual' | 'Business' | 'Restaurant' | 'School' | 'Hospital' {
    const typeMap: { [key: string]: 'Individual' | 'Business' | 'Restaurant' | 'School' | 'Hospital' } = {
      'individual': 'Individual',
      'business': 'Business',
      'restaurant': 'Restaurant',
      'school': 'School',
      'hospital': 'Hospital'
    };
    return typeMap[type.toLowerCase()] || 'Individual';
  }

  private mapStatus(status: string): 'Active' | 'Inactive' | 'Suspended' {
    const statusMap: { [key: string]: 'Active' | 'Inactive' | 'Suspended' } = {
      'active': 'Active',
      'inactive': 'Inactive',
      'suspended': 'Suspended'
    };
    return statusMap[status.toLowerCase()] || 'Inactive';
  }

  private loadMockData() {
    // Mock customers
    this.customers = [
      {
        id: '1',
        name: 'John Mukamana',
        phone: '+250788123456',
        email: 'john.mukamana@email.com',
        location: 'KG 123 St, Kigali',
        gpsCoordinates: '-1.9441,30.0619',
        businessType: 'Retail',
        customerType: 'Individual',
        buyingPricePerLiter: 1000,
        paymentMethod: 'Mobile Money',
        bankAccount: '',
        mobileMoneyNumber: '+250788123456',
        idNumber: '1234567890123456',
        notes: 'Prefers fresh milk, regular customer',
        profilePhoto: 'assets/img/user.png',
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-09-20T00:00:00.000Z',
        isActive: true,
        // Additional fields for UI compatibility
        address: 'KG 123 St, Kigali',
        city: 'Kigali',
        region: 'Kigali',
        status: 'Active',
        registrationDate: new Date('2024-01-15'),
        lastPurchaseDate: new Date('2024-09-20'),
        totalPurchases: 45,
        totalAmount: 225000,
        preferredDeliveryTime: 'Morning (8:00-10:00)',
        avatar: 'assets/img/user.png',
        pricePerLiter: 1000
      },
      {
        id: '2',
        name: 'Rwanda School Complex',
        phone: '+250788234567',
        email: 'admin@rwandaschool.rw',
        location: 'KG 456 St, Kigali',
        gpsCoordinates: '-1.9441,30.0619',
        businessType: 'Education',
        customerType: 'School',
        buyingPricePerLiter: 1000,
        paymentMethod: 'Bank Transfer',
        bankAccount: '1234567890',
        mobileMoneyNumber: '',
        idNumber: 'SCHOOL001',
        notes: 'Large quantity orders for school meals',
        profilePhoto: 'assets/img/user.png',
        createdAt: '2024-02-10T00:00:00.000Z',
        updatedAt: '2024-09-22T00:00:00.000Z',
        isActive: true,
        // Additional fields for UI compatibility
        address: 'KG 456 St, Kigali',
        city: 'Kigali',
        region: 'Kigali',
        status: 'Active',
        registrationDate: new Date('2024-02-10'),
        lastPurchaseDate: new Date('2024-09-22'),
        totalPurchases: 120,
        totalAmount: 600000,
        preferredDeliveryTime: 'Early Morning (6:00-8:00)',
        avatar: 'assets/img/user.png',
        pricePerLiter: 1000
      },
      {
        id: '3',
        name: 'Marie Uwimana',
        phone: '+250788345678',
        email: 'marie.uwimana@email.com',
        location: 'KG 789 St, Kigali',
        gpsCoordinates: '-1.9441,30.0619',
        businessType: 'Retail',
        customerType: 'Individual',
        buyingPricePerLiter: 1200,
        paymentMethod: 'Cash',
        bankAccount: '',
        mobileMoneyNumber: '+250788345678',
        idNumber: '1234567890123457',
        notes: 'Prefers organic milk',
        profilePhoto: 'assets/img/user.png',
        createdAt: '2024-03-05T00:00:00.000Z',
        updatedAt: '2024-09-18T00:00:00.000Z',
        isActive: true,
        // Additional fields for UI compatibility
        address: 'KG 789 St, Kigali',
        city: 'Kigali',
        region: 'Kigali',
        status: 'Active',
        registrationDate: new Date('2024-03-05'),
        lastPurchaseDate: new Date('2024-09-18'),
        totalPurchases: 28,
        totalAmount: 140000,
        preferredDeliveryTime: 'Evening (17:00-19:00)',
        avatar: 'assets/img/user.png',
        pricePerLiter: 1200
      },
      {
        id: '4',
        name: 'Hotel des Mille Collines',
        phone: '+250788456789',
        email: 'purchasing@millecollines.rw',
        location: 'KG 321 St, Kigali',
        gpsCoordinates: '-1.9441,30.0619',
        businessType: 'Hospitality',
        customerType: 'Business',
        buyingPricePerLiter: 1500,
        paymentMethod: 'Bank Transfer',
        bankAccount: '9876543210',
        mobileMoneyNumber: '',
        idNumber: 'HOTEL001',
        notes: 'Premium hotel, requires high quality milk',
        profilePhoto: 'assets/img/user.png',
        createdAt: '2024-01-20T00:00:00.000Z',
        updatedAt: '2024-09-23T00:00:00.000Z',
        isActive: true,
        // Additional fields for UI compatibility
        address: 'KG 321 St, Kigali',
        city: 'Kigali',
        region: 'Kigali',
        status: 'Active',
        registrationDate: new Date('2024-01-20'),
        lastPurchaseDate: new Date('2024-09-23'),
        totalPurchases: 200,
        totalAmount: 1000000,
        preferredDeliveryTime: 'Morning (7:00-9:00)',
        avatar: 'assets/img/user.png',
        pricePerLiter: 1500
      },
      {
        id: '5',
        name: 'Kigali Hospital',
        phone: '+250788567890',
        email: 'supplies@kigalihospital.rw',
        location: 'KG 654 St, Kigali',
        gpsCoordinates: '-1.9441,30.0619',
        businessType: 'Healthcare',
        customerType: 'Hospital',
        buyingPricePerLiter: 1300,
        paymentMethod: 'Bank Transfer',
        bankAccount: '5555666677',
        mobileMoneyNumber: '',
        idNumber: 'HOSPITAL001',
        notes: 'Medical facility, requires pasteurized milk',
        profilePhoto: 'assets/img/user.png',
        createdAt: '2024-02-15T00:00:00.000Z',
        updatedAt: '2024-09-21T00:00:00.000Z',
        isActive: true,
        // Additional fields for UI compatibility
        address: 'KG 654 St, Kigali',
        city: 'Kigali',
        region: 'Kigali',
        status: 'Active',
        registrationDate: new Date('2024-02-15'),
        lastPurchaseDate: new Date('2024-09-21'),
        totalPurchases: 150,
        totalAmount: 750000,
        preferredDeliveryTime: 'Early Morning (5:00-7:00)',
        avatar: 'assets/img/user.png',
        pricePerLiter: 1300
      }
    ];

    // Mock milk sales
    this.milkSales = [
      {
        id: 's1',
        customerId: '1',
        customerName: 'John Mukamana',
        date: new Date('2024-09-20'),
        quantity: 5,
        pricePerLiter: 1000,
        totalAmount: 5000,
        paymentMethod: 'Mobile Money',
        paymentStatus: 'Paid',
        deliveryMethod: 'Delivery',
        deliveryAddress: 'KG 123 St, Kigali',
        notes: 'Regular order'
      },
      {
        id: 's2',
        customerId: '2',
        customerName: 'Rwanda School Complex',
        date: new Date('2024-09-22'),
        quantity: 20,
        pricePerLiter: 1000,
        totalAmount: 20000,
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Paid',
        deliveryMethod: 'Delivery',
        deliveryAddress: 'KG 456 St, Kigali',
        notes: 'Weekly school order'
      },
      {
        id: 's3',
        customerId: '4',
        customerName: 'Hotel des Mille Collines',
        date: new Date('2024-09-23'),
        quantity: 15,
        pricePerLiter: 1200,
        totalAmount: 18000,
        paymentMethod: 'Bank Transfer',
        paymentStatus: 'Paid',
        deliveryMethod: 'Delivery',
        deliveryAddress: 'KG 321 St, Kigali',
        notes: 'Premium quality milk'
      }
    ];
  }
}
