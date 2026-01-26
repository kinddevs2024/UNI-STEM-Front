# UNI STEM (Frontend)

A professional frontend for the UNI STEM platform—online academic olympiads with advanced proctoring features including screen and camera monitoring.

## Features

- 🎯 **Multiple Olympiad Types**: Test (multiple choice) and Essay formats
- 📹 **Advanced Proctoring**: Real-time camera and screen monitoring
- ⏱️ **Timer System**: Countdown timer with auto-submit
- 📊 **Real-time Leaderboard**: Live rankings via Socket.io
- 👥 **Role-based Access**: Student, Admin, and Owner roles
- 🎨 **Modern UI**: Black & white design inspired by Nothing Phone
- 📱 **Responsive Design**: Works on all devices

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Axios
- Socket.io Client
- CSS3 with animations

### Backend (To be implemented)

- Node.js/Express
- MongoDB/Mongoose
- Socket.io
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Start the development server:

```bash
npm run dev
```

Or from the root directory:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
olympiad-platform/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React contexts
│   │   ├── services/       # API and Socket services
│   │   ├── styles/         # Global styles and animations
│   │   ├── utils/          # Helper functions
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Features in Detail

### Proctoring System

- **Camera Monitoring**: Front-facing camera capture every 30 seconds
- **Screen Recording**: Screen sharing with periodic screenshots
- **Consent System**: User must agree to monitoring before starting
- **Secure Storage**: All captures uploaded to backend

### User Roles

- **Student**: Take olympiads, view results
- **Admin**: Create/manage olympiads, view submissions
- **Owner**: Full platform access, user management, analytics

### Olympiad Types

- **Test**: Multiple choice questions with immediate navigation
- **Essay**: Text editor with word/character count

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=780692716304-p2k6rmk2gtlrhrrf1ltncl986b1hqgrf.apps.googleusercontent.com
```

**Note:** The Google Client ID is already configured in `src/utils/constants.js` as a fallback, but you can override it using the environment variable above.

**Important for Backend:** The Google Client Secret (`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`) should be configured on your backend server only, not in the frontend. The backend needs it to verify Google access tokens.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

If `vite` command is not found:

- Make sure you've run `npm install` in the frontend directory
- The package.json now uses `npx vite` which should work even if vite isn't in PATH
- Try running `npm run dev` from the frontend directory

## License

MIT
