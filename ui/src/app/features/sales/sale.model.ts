export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  quantity: number;
  pricePerLiter: number;
  totalValue: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  rejectionReason?: string;
  notes?: string;
  saleAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSaleRequest {
  customerAccountCode: string;
  quantity: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  notes?: string;
  saleAt: Date;
}

export interface UpdateSaleRequest {
  saleId: string;
  customerAccountCode?: string;
  quantity?: number;
  pricePerLiter?: number;
  status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  saleAt?: Date;
  notes?: string;
}

export interface CancelSaleRequest {
  saleId: string;
}

export interface SaleStats {
  totalQuantity: number;
  totalValue: number;
  totalSales: number;
  statusCounts: {
    accepted: number;
    rejected: number;
    pending: number;
    cancelled: number;
  };
}
