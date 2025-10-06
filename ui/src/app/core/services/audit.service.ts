import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'APPROVE' | 'REJECT';
export type AuditResource = 'USER' | 'ENTITY' | 'ROLE' | 'PERMISSION' | 'TRANSACTION' | 'CONFIGURATION';

export interface AuditTrail {
  id: number;
  timestamp: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  userId: string;
  userType: 'Human' | 'Application';
  ipAddress: string;
  oldValue?: string;
  newValue?: string;
  status: 'SUCCESS' | 'FAILURE';
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private mockAuditTrails: AuditTrail[] = [
    {
      id: 1,
      timestamp: '2024-03-16T12:30:00',
      action: 'CREATE',
      resource: 'ENTITY',
      resourceId: 'ENT001',
      userId: 'john.doe',
      userType: 'Human',
      ipAddress: '192.168.1.100',
      newValue: '{"name": "Bank A", "type": "Financial Institution", "status": "active"}',
      status: 'SUCCESS'
    },
    {
      id: 2,
      timestamp: '2024-03-16T12:29:00',
      action: 'UPDATE',
      resource: 'USER',
      resourceId: 'USR002',
      userId: 'admin',
      userType: 'Human',
      ipAddress: '192.168.1.101',
      oldValue: '{"role": "User"}',
      newValue: '{"role": "Manager"}',
      status: 'SUCCESS'
    },
    {
      id: 3,
      timestamp: '2024-03-16T12:28:00',
      action: 'LOGIN',
      resource: 'USER',
      resourceId: 'USR003',
      userId: 'jane.smith',
      userType: 'Human',
      ipAddress: '192.168.1.102',
      status: 'FAILURE',
      reason: 'Invalid password'
    },
    {
      id: 4,
      timestamp: '2024-03-16T12:27:00',
      action: 'DELETE',
      resource: 'ROLE',
      resourceId: 'ROL001',
      userId: 'admin',
      userType: 'Human',
      ipAddress: '192.168.1.101',
      oldValue: '{"name": "Temporary Role", "permissions": ["VIEW"]}',
      status: 'SUCCESS'
    },
    {
      id: 5,
      timestamp: '2024-03-16T12:26:00',
      action: 'APPROVE',
      resource: 'TRANSACTION',
      resourceId: 'TRX001',
      userId: 'payment.gateway',
      userType: 'Application',
      ipAddress: '192.168.1.200',
      status: 'SUCCESS'
    },
    {
      id: 6,
      timestamp: '2024-03-16T12:25:00',
      action: 'UPDATE',
      resource: 'CONFIGURATION',
      resourceId: 'CFG001',
      userId: 'system',
      userType: 'Application',
      ipAddress: '192.168.1.1',
      oldValue: '{"timeout": 30}',
      newValue: '{"timeout": 60}',
      status: 'SUCCESS'
    },
    {
      id: 7,
      timestamp: '2024-03-16T12:24:00',
      action: 'REJECT',
      resource: 'TRANSACTION',
      resourceId: 'TRX002',
      userId: 'jane.smith',
      userType: 'Human',
      ipAddress: '192.168.1.102',
      status: 'SUCCESS',
      reason: 'Amount exceeds daily limit'
    },
    {
      id: 8,
      timestamp: '2024-03-16T12:23:00',
      action: 'CREATE',
      resource: 'PERMISSION',
      resourceId: 'PER001',
      userId: 'admin',
      userType: 'Human',
      ipAddress: '192.168.1.101',
      newValue: '{"name": "MANAGE_TRANSACTIONS", "description": "Can manage all transactions"}',
      status: 'SUCCESS'
    },
    {
      id: 9,
      timestamp: '2024-03-16T12:22:00',
      action: 'LOGOUT',
      resource: 'USER',
      resourceId: 'USR004',
      userId: 'michael.chen',
      userType: 'Human',
      ipAddress: '192.168.1.103',
      status: 'SUCCESS'
    },
    {
      id: 10,
      timestamp: '2024-03-16T12:21:00',
      action: 'UPDATE',
      resource: 'ENTITY',
      resourceId: 'ENT002',
      userId: 'notification.service',
      userType: 'Application',
      ipAddress: '192.168.1.201',
      oldValue: '{"status": "inactive"}',
      newValue: '{"status": "active"}',
      status: 'SUCCESS'
    }
  ];

  constructor(private http: HttpClient) {}

  getMockAuditTrails(): AuditTrail[] {
    return this.mockAuditTrails;
  }

  getAuditActions(): AuditAction[] {
    return ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT'];
  }

  getAuditResources(): AuditResource[] {
    return ['USER', 'ENTITY', 'ROLE', 'PERMISSION', 'TRANSACTION', 'CONFIGURATION'];
  }
}
