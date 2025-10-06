import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config = environment;

  // API Configuration
  get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  get authEndpoint(): string {
    return this.config.endpoints.auth;
  }

  get profileEndpoint(): string {
    return this.config.endpoints.profile;
  }

  get usersEndpoint(): string {
    return this.config.endpoints.users;
  }

  get entitiesEndpoint(): string {
    return this.config.endpoints.entities;
  }

  get rolesEndpoint(): string {
    return this.config.endpoints.roles;
  }

  get permissionsEndpoint(): string {
    return this.config.endpoints.permissions;
  }

  get auditEndpoint(): string {
    return this.config.endpoints.audit;
  }

  get logsEndpoint(): string {
    return this.config.endpoints.logs;
  }

  // App Configuration
  get appName(): string {
    return this.config.appName;
  }

  get appVersion(): string {
    return this.config.appVersion;
  }

  get isProduction(): boolean {
    return this.config.production;
  }

  // Features Configuration
  get features() {
    return this.config.features;
  }

  isFeatureEnabled(feature: keyof typeof this.config.features): boolean {
    return this.config.features[feature];
  }

  // Auth Configuration
  get authConfig() {
    return this.config.auth;
  }

  get tokenKey(): string {
    return this.config.auth.tokenKey;
  }

  get userKey(): string {
    return this.config.auth.userKey;
  }

  get loginKey(): string {
    return this.config.auth.loginKey;
  }

  get sessionTimeout(): number {
    return this.config.auth.sessionTimeout;
  }

  // UI Configuration
  get uiConfig() {
    return this.config.ui;
  }

  get theme() {
    return this.config.ui.theme;
  }

  get sidebarConfig() {
    return this.config.ui.sidebar;
  }

  // Helper methods
  getFullUrl(endpoint: string): string {
    return `${this.apiBaseUrl}${endpoint}`;
  }

  getAuthUrl(endpoint: string): string {
    return `${this.apiBaseUrl}${this.authEndpoint}${endpoint}`;
  }

  getProfileUrl(endpoint: string): string {
    return `${this.apiBaseUrl}${this.profileEndpoint}${endpoint}`;
  }

  // Development helpers
  get isDevelopment(): boolean {
    return !this.isProduction;
  }

  get isDebugMode(): boolean {
    return this.isDevelopment;
  }
}
