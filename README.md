# PN8.ai - AI Image Prompt Builder

A web application for building precise prompts for AI image generation, specifically designed for Nano Banana Pro and similar models.

## Features

### User Accounts
- **Email OTP Authentication**: Sign in with email verification code (no passwords)
- **Cloud Sync**: Save prompts to your account, access from any device
- **Guest Mode**: Use the app without signing in (prompts saved locally)

### Camera Settings
- **Camera Type**: DSLR, Mirrorless, Medium Format, Hasselblad, Leica, RED Cinema, ARRI Alexa, etc.
- **Lens**: Fisheye to Super Telephoto, Macro, Tilt-Shift, Anamorphic, Vintage
- **Film Stock**: Kodak Portra, Fuji Velvia, CineStill 800T, Ilford HP5, and more
- **ISO**: 50-6400 with grain descriptions
- **Aperture**: f/1.2-f/22 with depth of field descriptions
- **Shutter Speed**: 1/8000s to 30s long exposure

### Scene Setup
- **Subject(s) / Action(s)**: Define up to 2 subjects with Name, Age, Appearance, and Action fields. Each subject appears in the prompt as [Subject 1] and [Subject 2]
- **Wardrobe**: Casual to haute couture, streetwear, vintage, cyberpunk
- **Environment**: Studio, urban, nature, industrial, neon city, underwater, space
- **Lighting**: Golden hour, Rembrandt, split light, neon, chiaroscuro

### Style & Quality
- Cinematic, editorial, documentary, fine art styles
- Moody, dreamy, gritty, clean aesthetics
- Vintage looks, film grain, vignettes, light leaks
- 8K resolution options

### Export Options
- Copy to clipboard
- Download as text file
- Share via native share API

## Tech Stack
- React + TypeScript + Vite (Frontend)
- Hono + Bun (Backend API)
- Prisma + SQLite (Database)
- Better Auth (Authentication)
- Tailwind CSS + shadcn/ui

## Getting Started
The app runs on port 8000. Simply open in browser and start selecting options to build your prompt.
