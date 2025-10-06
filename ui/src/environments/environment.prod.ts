export const environment = {
  production: true,
  apiBaseUrl: 'https://api.gemura.rw/v2',
  appName: 'iFinance',
  appVersion: '1.0.0',
  features: {
    enableAnalytics: true,
    enableNotifications: true,
    enableChat: true,
    enableReports: true
  },
  auth: {
    tokenKey: 'ihuzofinance.token',
    userKey: 'ihuzofinance.user',
    loginKey: 'ihuzofinance.isLoggedIn',
    sessionTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
  },
  ui: {
    theme: {
      primary: '#f24d12',
      secondary: '#515365',
      success: '#1abc9c',
      info: '#3498db',
      warning: '#f1c40f',
      danger: '#e74c3c'
    },
    sidebar: {
      width: 240,
      miniWidth: 70,
      headerHeight: 90
    }
  },
  endpoints: {
    auth: '/auth',
    profile: '/profile',
    users: '/users',
    entities: '/entities',
    roles: '/roles',
    permissions: '/permissions',
    audit: '/audit',
    logs: '/logs'
  }
};
