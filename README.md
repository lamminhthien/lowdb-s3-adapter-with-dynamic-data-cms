# Dynamic CMS with S3 Storage

A modern, flexible Content Management System built with Next.js, lowdb, and AWS S3 for storage. This CMS allows you to create dynamic data structures and manage content with a clean, intuitive interface.

## Features

- 🚀 **Dynamic Schema Creation**: Create custom content types with various field types
- 📁 **S3 Storage**: All data is stored in AWS S3 using a custom lowdb adapter
- 🔐 **Simple Authentication**: Username/password authentication with JWT tokens
- 📱 **Responsive Design**: Modern UI built with Tailwind CSS
- 🔧 **Form Validation**: Comprehensive validation for schemas and data entries
- ⚡ **Real-time Updates**: Instant feedback and updates throughout the interface

## Field Types Supported

- **Text**: Single-line text input
- **Textarea**: Multi-line text input
- **Number**: Numeric input with min/max validation
- **Boolean**: Checkbox input
- **Date**: Date picker
- **Email**: Email input with validation
- **URL**: URL input with validation
- **Select**: Dropdown with custom options

## Getting Started

### Prerequisites

- Node.js 18+ 
- AWS Account with S3 access
- AWS S3 bucket

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Configure your environment variables in `.env.local`:
```env
# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-key-should-be-very-long-and-random

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# Application
NEXT_PUBLIC_APP_NAME=Dynamic CMS
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Schema

1. Navigate to the admin dashboard
2. Click "New Schema"
3. Define your schema:
   - **Schema Name**: Internal identifier (e.g., `blog_posts`)
   - **Display Name**: Human-readable name (e.g., `Blog Posts`)
   - **Fields**: Add fields with different types and validation rules

### Managing Content

1. From the admin dashboard, click "Manage Content" on any schema
2. Create, edit, or delete content entries
3. All changes are automatically saved to your S3 bucket

## Architecture

### S3 Adapter

The custom S3 adapter implements the lowdb `Adapter` interface, allowing seamless integration with AWS S3.

### Authentication

Simple username/password authentication using JWT tokens and HTTP-only cookies for security.

## Security Considerations

- Change default admin credentials in production
- Use strong JWT secrets
- Enable HTTPS in production
- Configure proper S3 bucket permissions

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
