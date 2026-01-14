# LinkedIn Post Preview Generator

A web-based tool that accurately simulates how LinkedIn posts will appear across mobile, tablet, and desktop devices before publishing.

## Features

- **Multi-Device Preview**: View posts exactly as they'll appear on mobile, tablet, and desktop
- **Profile Customization**: Add your name, headline, and profile picture (persisted locally)
- **Media Support**: Preview images, PDFs, and polls
- **Dark Mode**: Toggle between light and dark themes
- **Smart Formatting**: Auto-spacing for better readability
- **Height-Based Truncation**: Matches LinkedIn's exact "see more" behavior
- **Download Previews**: Export preview images with ColdIQ watermark
- **Embed Ready**: iframe support for wider distribution

## Local Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000` (or the next available port).

## Tech Stack

- React
- Vercel (deployment)
- modern-screenshot (image capture)

## Purpose

Built by ColdIQ to provide genuine value to LinkedIn content creators while driving inbound leads through strategic features like watermarked downloads and increased web traffic.

## Development

The tool prioritizes visual accuracy, matching LinkedIn's exact behavior including:
- Device-specific preview widths
- Precise color schemes and typography
- Height-based truncation logic
- Platform-specific UI elements

## Status

Collecting feedback before public launch and SEO implementation.

## Future Vision

Part of a broader LinkedIn lead magnet suite that may include:
- Hook generators
- Post generators
- Additional content creation tools
