# WebcamMicTest

**Free online tool to test your webcam, microphone, and audio devices before video calls.**

Test your camera and mic quality instantly with real-time visualization and recording capabilities.

🔗 **Live Demo:** [https://webcammictest.net](https://webcammictest.net)

## ✨ Features

- 📹 **Live Webcam Preview** - See your camera feed in real-time
- 🎤 **Microphone Level Monitor** - Visual microphone input visualization
- 🔄 **Device Selection** - Switch between multiple cameras and microphones
- 🪞 **Mirror Toggle** - Flip the video feed
- 🎥 **Record Videos** - Record and download test videos
- 📸 **Take Screenshots** - Capture snapshots from your webcam
- ⚡ **No Installation** - Works directly in your browser
- 🔒 **Private** - All data stays on your device, nothing is uploaded

## 🚀 Quick Start

Visit **[webcammictest.net](https://webcammictest.net)** and your camera should start automatically.

### Troubleshooting

1. **Camera won't start?** Click the "Restart" button
2. **Permission denied?** Allow browser access to camera/microphone
3. **No devices showing?** Ensure your webcam is connected and not used by another app

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/ramishenouda/WebcamMicTest.git
cd WebcamMicTest
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview  # Test production build locally
```

### Deploy to GitHub Pages

The app automatically deploys to GitHub Pages when you push to the `master` branch. GitHub Actions handles the build and deployment.

## 📦 Tech Stack

- **React 18** - UI framework
- **Vite 5** - Fast build tool
- **GitHub Pages** - Free hosting
- **Poppins Font** - Modern typography

## 🌐 Browser Support

- Chrome/Chromium 75+
- Firefox 55+
- Safari 14.1+
- Edge 79+

*Note: Your browser must support the Media Streams API and audio analysis*

## 📄 License

MIT - Feel free to use this project for any purpose

## 🤝 Contributing

Found a bug or have a feature suggestion? Feel free to open an issue or submit a pull request!

## 📞 Support

Having issues? Check the [deployment guide](DEPLOYMENT.md) or open an issue on GitHub.
- Responsive design

## Tech Stack

- React 18
- Vite
- JavaScript
- Plain CSS

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

The production build will be in the `dist` folder.

## Usage

1. Allow camera and microphone permissions when prompted
2. Select your camera and microphone from the dropdowns
3. View the live video stream and microphone level
4. Toggle the mirror effect if desired
5. Click "Restart Test" to reconnect or switch devices
