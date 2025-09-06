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
- AWS Account with S3 access OR MinIO server OR other S3-compatible service
- S3 bucket (AWS S3, MinIO, etc.)

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

**For AWS S3:**
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
S3_ENDPOINT=
S3_FORCE_PATH_STYLE=false

# Application
NEXT_PUBLIC_APP_NAME=Dynamic CMS
```

**For MinIO or other S3-compatible services:**
```env
# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-key-should-be-very-long-and-random

# MinIO/S3-Compatible Service Configuration
AWS_ACCESS_KEY_ID=your-minio-access-key
AWS_SECRET_ACCESS_KEY=your-minio-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true

# Application
NEXT_PUBLIC_APP_NAME=Dynamic CMS
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## S3-Compatible Services

### Using MinIO

MinIO is a high-performance, S3-compatible object storage server. To use MinIO:

1. **Install and run MinIO:**
```bash
# Using Docker
docker run -d -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

2. **Create bucket using MinIO Client (mc):**

First, install MinIO client:
```bash
# macOS
brew install minio/stable/mc

# Linux
curl https://dl.min.io/client/mc/release/linux-amd64/mc \
  --create-dirs \
  -o $HOME/minio-binaries/mc
chmod +x $HOME/minio-binaries/mc
export PATH=$PATH:$HOME/minio-binaries/

# Windows
# Download from https://dl.min.io/client/mc/release/windows-amd64/mc.exe
```

Configure and create bucket:
```bash
# Add MinIO server alias
mc alias set local http://localhost:9000 minioadmin minioadmin

# Create bucket
mc mb local/cms-data

# Grant public read access (optional, for public file access)
mc anonymous set download local/cms-data

# Verify bucket creation
mc ls local/
```

**Alternative: Using MinIO Console (Web UI):**
   - Access MinIO Console at `http://localhost:9001`
   - Login with `minioadmin` / `minioadmin`
   - Create a new bucket named `cms-data`
   - Set bucket policy to public read if needed

3. **Configure environment variables:**
```env
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=cms-data
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
```

### Other S3-Compatible Services

The CMS works with any S3-compatible service. Common options include:

- **DigitalOcean Spaces**: Set `S3_ENDPOINT=https://your-region.digitaloceanspaces.com`
- **Wasabi**: Set `S3_ENDPOINT=https://s3.your-region.wasabisys.com`
- **Backblaze B2**: Use their S3-compatible API endpoint
- **Cloudflare R2**: Set `S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com`

**Important**: Most non-AWS services require `S3_FORCE_PATH_STYLE=true`.

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
