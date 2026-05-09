# CropGuard - Setup Guide for Local Development

This guide will help you download and run the Crop Disease Detection platform on your local machine using VS Code.

## Prerequisites

Before you start, make sure you have installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: Open terminal and run `node --version`

2. **npm or pnpm** (package manager)
   - npm comes with Node.js automatically
   - Or install pnpm: `npm install -g pnpm`
   - Verify: Run `npm --version` or `pnpm --version`

3. **Git** (optional, for cloning)
   - Download from: https://git-scm.com/
   - Verify: Run `git --version`

4. **VS Code** (code editor)
   - Download from: https://code.visualstudio.com/

## Step 1: Download the Project

### Option A: Download as ZIP (Recommended for beginners)

1. Go to the Manus platform where your project is hosted
2. Click the "Download" or "Export" button to download the project as a ZIP file
3. Extract the ZIP file to a folder on your computer (e.g., `C:\Users\YourName\Documents\crop_disease_detection`)

### Option B: Clone with Git (If you have Git installed)

1. Open Terminal/Command Prompt
2. Navigate to where you want to save the project:
   ```bash
   cd Documents
   ```
3. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd crop_disease_detection
   ```

## Step 2: Open Project in VS Code

1. Open VS Code
2. Click **File** → **Open Folder**
3. Navigate to your `crop_disease_detection` folder and click **Select Folder**
4. The project will open in VS Code

## Step 3: Install Dependencies

1. Open the **Terminal** in VS Code:
   - Press `Ctrl + ~` (Windows/Linux) or `Cmd + ~` (Mac)
   - Or go to **View** → **Terminal**

2. In the terminal, run:
   ```bash
   npm install
   ```
   
   Or if you prefer pnpm:
   ```bash
   pnpm install
   ```

   This will download and install all required packages (React, Tailwind CSS, etc.)
   - This may take 2-5 minutes depending on your internet speed
   - Wait until you see the message: `added X packages`

## Step 4: Start the Development Server

1. In the VS Code terminal, run:
   ```bash
   npm run dev
   ```
   
   Or with pnpm:
   ```bash
   pnpm dev
   ```

2. You should see output like:
   ```
   ➜  Local:   http://localhost:3000/
   ➜  Network: http://192.168.x.x:3000/
   ```

3. Open your browser and go to: **http://localhost:3000/**

4. You should see the CropGuard home page with the "Get Started Now" button!

## Step 5: Explore the Application

- **Home Page**: Shows the main landing page with "Get Started Now" button
- **Sign Up**: Click "Get Started Now" to see the multi-step signup form
- **Dashboard**: After signup, view the dashboard with image upload interface
- **Profile Settings**: Click the user avatar (top-right) → "Profile Settings" to edit your profile
- **Account Settings**: Click the user avatar → "Account Settings" to change language and notifications
- **Logout**: Click the user avatar → "Logout" to sign out

## Step 6: Project Structure

```
crop_disease_detection/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── pages/            # Page components (Home, Signup, Dashboard, etc.)
│   │   ├── components/       # Reusable UI components
│   │   ├── _core/            # Core utilities (hooks, auth)
│   │   ├── lib/              # Libraries (tRPC, etc.)
│   │   ├── App.tsx           # Main app routing
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles (Tailwind)
│   ├── public/               # Static files
│   └── index.html            # HTML template
├── package.json              # Project dependencies
├── vite.config.ts            # Vite build configuration
├── tsconfig.json             # TypeScript configuration
└── todo.md                   # Feature checklist
```

## Common Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run check` | Check TypeScript errors |
| `npm run format` | Format code with Prettier |

## Troubleshooting

### Problem: "npm: command not found"
**Solution**: Node.js is not installed. Download and install from https://nodejs.org/

### Problem: Port 3000 already in use
**Solution**: Either:
- Close the application using port 3000
- Or change the port in `vite.config.ts` (line 177: change `port: 3000` to `port: 3001`)

### Problem: Dependencies installation fails
**Solution**: 
1. Delete the `node_modules` folder
2. Delete `package-lock.json` (if using npm)
3. Run `npm install` again

### Problem: Blank page or errors in browser
**Solution**:
1. Open browser DevTools (F12)
2. Check the Console tab for error messages
3. Try hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### Problem: Changes not reflecting in browser
**Solution**: The dev server has hot reload. If it's not working:
1. Stop the server: Press `Ctrl + C` in terminal
2. Run `npm run dev` again
3. Refresh the browser

## Next Steps

Once you have the frontend running, you can:

1. **Customize the Design**: Edit colors and styles in `client/src/index.css`
2. **Modify Pages**: Edit React components in `client/src/pages/`
3. **Add New Features**: Create new components and pages as needed
4. **Connect to Backend**: Update API calls in `client/src/_core/hooks/useAuth.ts` to connect to your backend server

## Need Help?

- **VS Code Documentation**: https://code.visualstudio.com/docs
- **React Documentation**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vite**: https://vitejs.dev/guide/

---

**Happy coding! 🚀**
