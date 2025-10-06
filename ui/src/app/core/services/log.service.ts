import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
export type LogSource = 'API' | 'SYSTEM' | 'AUTH' | 'DATABASE' | 'INTEGRATION';

export interface Log {
  id: number;
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  details: string;
  userId?: string;
  entityId?: string;
  transactionId?: string;
  ipAddress?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private mockLogs: Log[] = [
    {
      id: 1,
      timestamp: '2024-03-16T12:30:00',
      level: 'INFO',
      source: 'API',
      message: 'API request successful',
      details: 'GET /api/v1/entities - 200 OK',
      userId: 'john.doe',
      entityId: 'ENT001',
      transactionId: 'TRX123',
      ipAddress: '192.168.1.100'
    },
    {
      id: 2,
      timestamp: '2024-03-16T12:29:45',
      level: 'ERROR',
      source: 'DATABASE',
      message: 'Database connection failed',
      details: 'Connection timeout after 30s',
      transactionId: 'TRX122'
    },
    {
      id: 3,
      timestamp: '2024-03-16T12:28:30',
      level: 'WARNING',
      source: 'AUTH',
      message: 'Failed login attempt',
      details: 'Multiple failed attempts from same IP',
      userId: 'unknown',
      ipAddress: '192.168.1.101'
    },
    {
      id: 4,
      timestamp: '2024-03-16T12:27:15',
      level: 'INFO',
      source: 'SYSTEM',
      message: 'System backup completed',
      details: 'Backup size: 2.5GB'
    },
    {
      id: 5,
      timestamp: '2024-03-16T12:26:00',
      level: 'ERROR',
      source: 'INTEGRATION',
      message: 'Integration webhook failed',
      details: 'Endpoint not responding: https://api.external.com/webhook',
      entityId: 'ENT002',
      transactionId: 'TRX121'
    },
    {
      id: 6,
      timestamp: '2024-03-16T12:25:30',
      level: 'DEBUG',
      source: 'API',
      message: 'Request validation',
      details: 'Payload validation passed for POST /api/v1/transactions',
      userId: 'jane.smith',
      transactionId: 'TRX120'
    },
    {
      id: 7,
      timestamp: '2024-03-16T12:24:15',
      level: 'INFO',
      source: 'AUTH',
      message: 'User session expired',
      details: 'Session timeout after 30 minutes',
      userId: 'michael.chen',
      ipAddress: '192.168.1.102'
    },
    {
      id: 8,
      timestamp: '2024-03-16T12:23:00',
      level: 'WARNING',
      source: 'SYSTEM',
      message: 'High CPU usage detected',
      details: 'CPU usage at 85% for 5 minutes'
    },
    {
      id: 9,
      timestamp: '2024-03-16T12:22:45',
      level: 'ERROR',
      source: 'DATABASE',
      message: 'Query execution failed',
      details: 'Deadlock detected on table: transactions',
      transactionId: 'TRX119'
    },
    {
      id: 10,
      timestamp: '2024-03-16T12:21:30',
      level: 'INFO',
      source: 'INTEGRATION',
      message: 'New entity registered',
      details: 'Entity type: Financial Institution',
      entityId: 'ENT003',
      userId: 'admin'
    }
  ];

  constructor(private http: HttpClient) {}

  getMockLogs(): Log[] {
    return this.mockLogs;
  }

  getLogLevels(): LogLevel[] {
    return ['INFO', 'WARNING', 'ERROR', 'DEBUG'];
  }

  getLogSources(): LogSource[] {
    return ['API', 'SYSTEM', 'AUTH', 'DATABASE', 'INTEGRATION'];
  }
}
