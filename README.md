# Document Management System

A full-stack MEAN (MongoDB, Express.js, Angular, Node.js) document management application with features similar to Google Drive. Users can upload files, manage versions, share documents with permissions, and search by tags or filenames.

## Features

### Authentication
- User signup and login with JWT tokens
- Password hashing with bcrypt
- Protected routes and API endpoints

### Document Management
- Upload PDF and image files (JPG, PNG)
- Add custom tags to documents
- Search by filename or tags
- Download documents

### Version Control
- Upload new versions of existing documents
- Complete version history preserved
- Download any previous version
- Automatic version number increment

### Permissions & Sharing
- Owner-based access control
- Share documents with other users via email
- Two permission levels: View (download only) and Edit (upload new versions)
- Only owners can modify sharing settings

## Tech Stack

### Backend
- **Node.js** & **Express.js**: REST API server
- **MongoDB** & **Mongoose**: Document database
- **JWT**: Authentication tokens
- **bcrypt.js**: Password encryption
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing

### Frontend
- **Angular 17**: Standalone components architecture
- **Tailwind CSS**: Modern, responsive styling
- **RxJS**: Reactive programming
- **TypeScript**: Type-safe development

## Project Structure

```
Document Management System/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── documentController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   └── Document.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── documents.js
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── login/
    │   │   │   ├── dashboard/
    │   │   │   ├── upload-modal/
    │   │   │   └── document-list/
    │   │   ├── guards/
    │   │   │   └── auth.guard.ts
    │   │   ├── services/
    │   │   │   ├── auth.service.ts
    │   │   │   └── document.service.ts
    │   │   ├── app.component.ts
    │   │   ├── app.config.ts
    │   │   └── app.routes.ts
    │   ├── index.html
    │   ├── main.ts
    │   └── styles.css
    ├── angular.json
    ├── package.json
    ├── tailwind.config.js
    └── tsconfig.json
```

## Setup Instructions

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (v5 or higher)
- **npm** or **yarn**

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` file with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dms
JWT_SECRET=your_secret_key_change_this
```

5. Start MongoDB:
```bash
mongod
```

6. Start the backend server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The Angular app will run on `http://localhost:4200`

### Production Build

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/dms-frontend/`

## API Endpoints

### Authentication Routes

#### POST `/api/auth/signup`
Create new user account
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST `/api/auth/login`
Login existing user
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Document Routes (All require JWT token in Authorization header)

#### POST `/api/documents/upload`
Upload new document
- Form Data: `file`, `title`, `tags` (comma-separated)

#### POST `/api/documents/:id/version`
Upload new version of existing document
- Form Data: `file`

#### GET `/api/documents/`
Get all documents (owned + shared)

#### GET `/api/documents/search?query=searchterm`
Search documents by filename or tags

#### POST `/api/documents/:id/share`
Share document with another user
```json
{
  "email": "user@example.com",
  "permission": "view"
}
```

#### GET `/api/documents/:id/versions`
Get version history of a document

#### GET `/api/documents/:id/download?version=2`
Download document (optionally specify version number)

## Usage Guide

### 1. Create Account
- Navigate to the login page
- Click "Don't have an account? Sign up"
- Enter name, email, and password
- Click "Sign Up"

### 2. Upload Document
- Click "Upload Document" button on dashboard
- Enter document title
- Add tags (comma-separated, optional)
- Select PDF or image file
- Click "Upload Document"

### 3. Search Documents
- Use the search bar to filter by filename or tags
- Results update automatically as you type

### 4. Upload New Version
- Click the clock icon on any document you own or have edit access to
- Click "Upload New Version" in the modal
- Select new file
- Old version is automatically saved to history

### 5. Share Document
- Click the share icon (only visible for documents you own)
- Enter recipient's email address
- Choose permission level (View or Edit)
- Click "Share Document"

### 6. View Version History
- Click the clock icon on any document
- See all previous versions with upload dates
- Download any version by clicking its download button

## Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  timestamps: true
}
```

### Document Model
```javascript
{
  title: String,
  tags: [String],
  owner: ObjectId (ref: User),
  currentPath: String,
  currentVersion: Number,
  versions: [{
    filePath: String,
    versionNumber: Number,
    uploadedAt: Date
  }],
  sharedWith: [{
    user: ObjectId (ref: User),
    permission: String (view|edit)
  }],
  timestamps: true
}
```

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token-based authentication
- Protected API routes with middleware
- File type validation (PDF and images only)
- File size limit (10MB max)
- Owner-based permission checks
- CORS configuration

## Development Notes

- Backend runs on port 5000 by default
- Frontend development server runs on port 4200
- Uploaded files are stored in `backend/uploads/` directory
- MongoDB stores file metadata and paths, not the files themselves
- Version control preserves all previous file versions on disk

## Future Enhancements

- File preview functionality
- Folder organization
- Bulk file operations
- Activity logs
- Email notifications for sharing
- File encryption
- Cloud storage integration (AWS S3, Google Cloud Storage)
- Advanced search filters
- Document comments and annotations

## License

ISC

## Author

Document Management System - MEAN Stack Application
