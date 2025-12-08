# TechVault - Document Management System

A modern, feature-rich Document Management System (DMS) built with Angular and Node.js. TechVault provides enterprise-grade document management with real-time collaboration, version control, and advanced sharing capabilities.

![TechVault Banner](./DMS%20Captures/Landing%20Page.png)

## 🚀 Features

### Core Functionality
- **📁 Document Upload & Management** - Upload single files or entire folders with drag-and-drop support
- **📂 Folder Organization** - Create nested folder structures for organized document storage
- **🔍 Advanced Search** - Search documents by title, tags, and content
- **⭐ Favorites** - Star important documents for quick access
- **🗑️ Trash & Recovery** - Soft delete with restore functionality

### Collaboration & Sharing
- **👥 User Sharing** - Share documents with specific users with view/edit permissions
- **🔗 Public Links** - Generate shareable public links with optional password protection
- **💬 Comments** - Add comments and discussions on documents
- **📜 Activity Logs** - Track who accessed your documents and when

### Version Control
- **📊 Version History** - Maintain complete version history of documents
- **⏮️ Rollback** - Download or restore previous versions
- **🎨 Visual Timeline** - GitHub-style commit graph for version visualization

### Admin Features
- **👨‍💼 Admin Dashboard** - Comprehensive admin panel with system statistics
- **👤 User Management** - Manage users, roles, and permissions
- **📊 Storage Analytics** - Monitor storage usage and quotas
- **📈 Activity Monitoring** - View recent system activity

### Security & Authentication
- **🔐 JWT Authentication** - Secure token-based authentication
- **📧 Email Verification** - Email verification for new accounts
- **🔒 Role-Based Access Control** - User, Admin, and SuperAdmin roles
- **🛡️ Protected Routes** - Secure API endpoints with middleware

### User Experience
- **🌓 Dark Mode** - Beautiful dark theme support
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **⚡ Real-time Updates** - Live progress indicators for uploads
- **🎭 Smooth Animations** - Polished UI with micro-interactions

## 🛠️ Tech Stack

### Frontend
- **Framework**: Angular 18.2.13
- **Language**: TypeScript 5.5.x
- **Styling**: TailwindCSS (via vanilla CSS)
- **HTTP Client**: RxJS 7.8.x
- **Build Tool**: Angular CLI with Webpack

### Backend
- **Runtime**: Node.js 18.20.8
- **Framework**: Express.js 4.21.1
- **Database**: MongoDB 6.9.0 with Mongoose
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **File Upload**: Multer 1.4.5-lts.1
- **Email**: Nodemailer 6.9.16
- **Security**: bcryptjs 2.4.3

## 📋 Prerequisites

Ensure you have the following installed on your system:

| Software | Version | Download |
|----------|---------|----------|
| Node.js | 18.20.8 | [nodejs.org](https://nodejs.org/) |
| npm | 10.8.2+ | Comes with Node.js |
| MongoDB | 6.0+ | [mongodb.com](https://www.mongodb.com/try/download/community) |
| Angular CLI | 18.2.12 | `npm install -g @angular/cli` |

## ⚙️ Local Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/titanite07/smart-dms.git
cd smart-dms
```

### 2. Install Dependencies
```bash
# Install all dependencies (backend + frontend)
npm run install:all

# Or install separately:
# Backend
cd backend && npm install
# Frontend
cd frontend && npm install
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/dms?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:8000
```

**Important Notes:**
- Replace MongoDB URI with your actual connection string
- For Gmail, use [App Passwords](https://support.google.com/accounts/answer/185833)
- Generate a strong JWT secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 4. Start the Application

**Development Mode (Separate Servers):**

```bash
# Terminal 1 - Start Backend
cd backend
npm start
# Backend runs on http://localhost:5000

# Terminal 2 - Start Frontend
cd frontend
npm start
# Frontend runs on http://localhost:8000
```

**Production Mode (Single Deployment):**

```bash
# Build and start
npm run build
cd backend
npm start
# Access at http://localhost:5000
```

### 5. Access the Application

- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:5000/api
- **Admin Dashboard**: http://localhost:8000/admin (requires admin role)

### 6. Create Test Users

**Register via UI:**
1. Go to http://localhost:8000
2. Click "Sign Up"
3. Enter details and verify email

**Set Admin Role via MongoDB:**
1. Open MongoDB Compass/Atlas
2. Navigate to `dms` database → `users` collection
3. Find your user and change `role` to `"admin"` or `"superadmin"`

## 📸 Screenshots

### Landing Page
![Landing Page](./DMS%20Captures/Landing%20Page.png)
Beautiful landing page with modern design and call-to-action.

### Login & Signup
![Login](./DMS%20Captures/Login%20Page.png)
Secure authentication with email verification and red theme.

![Signup](./DMS%20Captures/Signup%20Page.png)
Signup page with password requirements and email availability check.

### Dashboard - All Files
![Dashboard](./DMS%20Captures/Home%20Page.png)
Main dashboard showing all documents and folders.

### Upload Files & Folders
![Upload](./DMS%20Captures/Upload%20Document.png)
Drag-and-drop upload with auto-tagging.

![Upload Progress](./DMS%20Captures/Upload%20Progress.png)
Real-time upload progress indicator for large folder uploads.

### Document Preview
![Preview](./DMS%20Captures/PDF%20Preview.png)
In-app document preview for PDFs and images.

### Version History
![Version History](./DMS%20Captures/Version%20History.png)
GitHub-style version timeline with commit graph.

### Share with Users
![Share Modal](./DMS%20Captures/Share%20Link.png)
Share documents with specific users and public link generation.

### Public Link Generation
### Folder Contents
![Folder](./DMS%20Captures/Contents%20within%20Folder.png)
Navigate through folder structures with nested documents.

### Comments
![Comments](./DMS%20Captures/Comments.png)
Add comments and discussions on documents.

### Starred Files
![Starred](./DMS%20Captures/Star1.png)
Quick access to favorite documents.

![Starred Details](./DMS%20Captures/Star2.png)
Starred documents with detailed view.

### Recent Activity
![Recent](./DMS%20Captures/Recent%20Activity.png)
View recently accessed documents.

### Shared Files
![Shared](./DMS%20Captures/Shared%20PAge.png)
Documents shared with you by others.

### Trash & Recovery
![Trash](./DMS%20Captures/Trash%20Page.png)
Recover deleted documents and folders.

### Admin Dashboard
### Activity Log
![Activity Log](./DMS%20Captures/Activity%20Log.png)
Track all user activities and document access logs.

### Dark Mode
### Light Theme
![Light Mode](./DMS%20Captures/Light%20Theme%20Page.png)
Clean and modern light theme interface.

## 🏗️ Project Structure

```
smart-dms/
├── backend/                 # Node.js/Express backend
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Auth & upload middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── uploads/            # File storage
│   ├── public/             # Served frontend (production)
│   └── server.js           # Entry point
├── frontend/               # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/ # UI components
│   │   │   ├── services/   # API services
│   │   │   └── guards/     # Route guards
│   │   └── environments/   # Environment configs
│   └── angular.json        # Angular configuration
├── DMS Captures/           # Screenshots for documentation
├── package.json            # Root package (build scripts)
└── README.md              # This file
```

## 📝 API Documentation

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email
- `GET /api/auth/me` - Get current user

### Documents
- `GET /api/documents` - Get all documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/share` - Share document
- `POST /api/documents/:id/public-link` - Generate public link
- `POST /api/documents/:id/star` - Toggle star
- `GET /api/documents/public/:token` - Access via public link

### Folders
- `POST /api/folders` - Create folder
- `GET /api/folders/:id/contents` - Get folder contents
- `DELETE /api/folders/:id` - Delete folder

### Admin
- `GET /api/admin/dashboard` - Get admin stats
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role

## 🚀 Deployment

### Deploy to Render

1. **Push to GitHub**
```bash
git push origin master
```

2. **Connect to Render**
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect your GitHub repository

3. **Configure Build**
   - Build Command: `npm run install:all && npm run build`
   - Start Command: `cd backend && npm start`

4. **Set Environment Variables**
   - Add all variables from `.env` file
   - Update `FRONTEND_URL` to your Render URL

### Deploy Frontend Separately

To deploy frontend to Netlify/Vercel:
```bash
cd frontend
npm run build
# Deploy the dist/dms-frontend folder
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and email verification
- [ ] Login and authentication
- [ ] Upload single file
- [ ] Upload folder with nested structure
- [ ] Create folders
- [ ] Search documents
- [ ] Star/unstar documents
- [ ] Share document with user
- [ ] Generate public link
- [ ] Access public link (logged out)
- [ ] Add comments
- [ ] Upload new version
- [ ] Download previous version
- [ ] View admin dashboard (admin user)
- [ ] Manage user roles
- [ ] Delete and restore documents
- [ ] Dark mode toggle

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# If getting ETIMEOUT errors:
# 1. Check MongoDB Atlas Network Access (add 0.0.0.0/0)
# 2. Verify connection string is correct
# 3. Try changing DNS to 8.8.8.8 (Google DNS)
```

### Port Already in Use
```bash
# Kill process on port 5000
npx kill-port 5000

# Kill process on port 8000
npx kill-port 8000
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
cd frontend
rm -rf .angular node_modules
npm install
```

## 🤝 Contributing

This project was created as an assignment. For improvements:
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is created for educational purposes.

## 👤 Author

**Tarun Balaji V**
- GitHub: [@titanite07](https://github.com/titanite07)
- Project Repository: [smart-dms](https://github.com/titanite07/smart-dms)

## 🙏 Acknowledgments

- Angular Team for the excellent framework
- MongoDB for the database solution
- TailwindCSS for styling inspiration
- All open-source contributors

---

**Note**: This is a submission for SmartWinnr assignment. All concepts and implementation are original work completed within the deadline.

**Submission Date**: December 2025
