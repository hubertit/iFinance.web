# iFinance Web Application

A comprehensive dairy farming management system built with Angular, designed to match the functionality of the Flutter mobile app.

## Features

- **Authentication System**: Login with email/phone, registration with account types
- **User Management**: Support for multiple account types (Farmer, Veterinarian, Supplier, etc.)
- **API Integration**: Connected to the same API as the Flutter app (`https://api.gemura.rw/v2`)
- **Responsive Design**: Works on desktop and mobile devices
- **cPanel Deployment**: Optimized for shared hosting

## Account Types

- **Farmer**: Dairy farmers managing their livestock
- **Veterinarian**: Animal health professionals
- **Supplier**: Feed and equipment suppliers
- **Customer**: Milk buyers
- **Agent**: Field agents
- **Collector**: Milk collectors
- **MCC**: Milk Collection Centers

## Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm start
```
Navigate to `http://localhost:4200/`

### Build for Production
```bash
npm run build:prod
```

## Deployment to cPanel

### Automatic Deployment
```bash
npm run deploy
```

### Manual Deployment
1. Build the application:
   ```bash
   ng build --configuration production
   ```

2. Upload the contents of `dist/frontend/browser/` to your cPanel `public_html` directory

3. Upload the `.htaccess` file to the same directory

4. Ensure your domain is properly configured

### cPanel Configuration
- **Document Root**: `public_html`
- **PHP Version**: 8.0 or higher (if using PHP features)
- **SSL Certificate**: Recommended for production

## API Configuration

The application is configured to use the iFinance API at `https://api.gemura.rw/v2`. All authentication and data operations use the same endpoints as the Flutter mobile app.

### Environment Variables
No environment variables are required as the API URL is hardcoded to match the Flutter app configuration.

## Authentication Flow

1. **Login**: Users can login with either email or phone number
2. **Registration**: New users can register with account type selection
3. **Password Reset**: Available through the API
4. **Profile Management**: Users can update their profiles

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Build Issues
- Ensure Node.js version is 18 or higher
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Deployment Issues
- Check that all files are uploaded to the correct directory
- Verify .htaccess file is present
- Ensure mod_rewrite is enabled on your server

### API Issues
- Check browser console for network errors
- Verify API endpoint is accessible
- Check CORS configuration if needed

## Support

For technical support, contact the development team or refer to the Flutter app documentation for API details.