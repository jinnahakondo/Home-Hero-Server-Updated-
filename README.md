# Home Hero Server

A Node.js/Express backend server for the Home Hero service marketplace application.

## Features

- **Authentication**: Firebase Admin SDK for secure user authentication
- **Database**: MongoDB for data storage
- **Services Management**: CRUD operations for home services
- **Booking System**: Service booking and management
- **Review System**: User reviews and ratings for services
- **Role-based Access**: User and admin role management
- **Real-time Data**: RESTful API with proper error handling

## API Endpoints

### Public Endpoints
- `GET /` - Server status
- `GET /health` - Health check
- `GET /services` - Get all services
- `GET /services/home` - Get latest 5 services
- `GET /services/:id` - Get single service
- `GET /filter-services` - Filter services by price range
- `GET /testimonials` - Get service reviews

### Protected Endpoints (Require Authentication)

#### User Management
- `POST /users` - Create user
- `GET /users/role` - Get user role

#### Service Management
- `POST /services` - Create service (authenticated users)
- `PATCH /services/:id` - Update service (service owner only)
- `DELETE /services/:id` - Delete service (service owner only)
- `GET /my-services` - Get user's services
- `PATCH /services/reviews/:id` - Add review to service

#### Booking Management
- `POST /bookings` - Create booking
- `GET /my-bookings` - Get user's bookings
- `DELETE /booking/:id` - Cancel booking
- `PATCH /bookings/:id` - Update booking status

#### Admin Only Endpoints
- `GET /stats` - Get dashboard statistics
- `GET /all-bookings` - Get all bookings
- `GET /all-users` - Get all users
- `PATCH /users/:id/role` - Update user role

## Environment Variables

Create a `.env` file with:

```env
DB_USERNAME=your_mongodb_username
DB_PASSWORD=your_mongodb_password
FIREBASE_SERVICE_KEY=your_base64_encoded_firebase_service_key
PORT=3000
```

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` file

3. Start development server:
```bash
npm run dev
```

4. Start production server:
```bash
npm start
```

## Database Collections

- **users**: User profiles and roles
- **Services**: Home services listings
- **bookings**: Service bookings and appointments

## Security Features

- Firebase JWT token validation
- Role-based access control
- Input validation middleware
- CORS configuration
- Request logging
- Error handling

## Deployment

Configured for Vercel deployment with `vercel.json` configuration.

## Technologies Used

- Node.js & Express.js
- MongoDB with native driver
- Firebase Admin SDK
- CORS middleware
- dotenv for environment management
