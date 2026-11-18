# Vision Board

A beautiful, modern digital vision board application built with React, TypeScript, and Firebase. Create and organize your dreams, goals, philosophies, and inspirations in one elegant sanctuary.

![Vision Board](https://i.pinimg.com/736x/db/0e/e2/db0ee2de02e731141a8394b059f54c04.jpg)

## ✨ Features

- **Theory Cards** - Save inspiring quotes and philosophical insights
- **Wish Cards** - Track your goals and dreams with progress indicators
- **Image Gallery** - Curate a visual collection of inspiration
- **Video Library** - Embed motivational videos from YouTube
- **Category Filters** - Organize content by Career, Health, Travel, Creativity, Relationships, and Personal
- **Focus Mode** - Distraction-free viewing experience
- **Real-time Sync** - All data synced with Cloud Firebase Firestore & Storage
- **Responsive Design** - Beautiful on all devices

## 🎨 Design

The application features a warm, sophisticated color palette inspired by natural earth tones:
- Dark Chocolate (#56332B)
- Warm Terracotta (#A0765E)
- Dusty Mauve (#B2A3A1)
- Warm Tan (#CDA991)
- Light Cream (#EADACE)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase project (Authentication, Firestore Database, and Storage enabled)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/abhi0626-kr/vision-board.git
cd vision-board
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` or `.env.local` file in the root directory:
```env
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
VITE_FIREBASE_MEASUREMENT_ID="your_measurement_id"
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:8080](http://localhost:8080) in your browser.

## 🗄️ Database Setup (Firebase Firestore)

Firestore collections used by the application:
- `vision_theories`: Inspirational theories and quotes
- `vision_wishes`: Goals, dreams, and completion statuses
- `vision_images`: Curated vision board imagery
- `vision_videos`: Motivational video links
- `user_profiles`: User profile settings and aspirations
- `user_reflections`: Notes, strengths, and weaknesses
- `secret_notes`: Private end-to-end encrypted notes vault

Security rules are defined in `firestore.rules` and `storage.rules`. Deploy them with:
```bash
firebase deploy --only firestore:rules,storage
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Firebase (Cloud Firestore, Auth, Storage)
- **Build Tool**: Vite
- **Routing**: React Router
- **State Management**: React Query
- **Authentication**: Firebase Auth (Email/Password & Google OAuth)

## 📁 Project Structure

```
visioncardabhi/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   └── vision/          # Vision board specific components
│   ├── pages/               # Page components
│   ├── lib/                 # Utilities and configurations
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   └── data/                # Initial data and constants
├── supabase/
│   └── migrations/          # Database migrations
└── public/                  # Static assets
```

## 🎯 Usage

1. **Add Content**: Click the "Add to Vision Board" button to create new items
2. **Filter by Category**: Use the category buttons to focus on specific areas
3. **Edit Items**: Hover over cards and click the edit icon
4. **Focus Mode**: Toggle focus mode for a distraction-free view
5. **Track Progress**: Check off wishes as you complete them

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments


## 📧 Contact

Project Link: [https://github.com/abhi0626-kr/vision-board](https://github.com/abhi0626-kr/vision-board)


Built with ❤️ for dreamers and doers
## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
