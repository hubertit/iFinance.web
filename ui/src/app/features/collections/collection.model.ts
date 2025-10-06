export interface Collection {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  quantity: number;
  pricePerLiter: number;
  totalValue: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  rejectionReason?: string;
  quality?: string;
  notes?: string;
  collectionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCollectionRequest {
  supplierAccountCode: string;
  quantity: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  notes?: string;
  collectionAt: Date;
}

export interface UpdateCollectionRequest {
  collectionId: string;
  quantity?: number;
  pricePerLiter?: number;
  status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  collectionAt?: Date;
  notes?: string;
}

export interface ApproveCollectionRequest {
  collectionId: string;
  notes?: string;
}

export interface RejectCollectionRequest {
  collectionId: string;
  rejectionReason: string;
  notes?: string;
}

export interface CollectionStats {
  totalQuantity: number;
  totalValue: number;
  totalCollections: number;
  statusCounts: {
    pending: number;
    accepted: number;
    rejected: number;
    cancelled: number;
  };
}