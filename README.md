# CARMA - Complete Automotive Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/marcmaupter-7186s-projects/v0-carma)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 🚗 Overview

CARMA is a comprehensive automotive platform that provides users with the complete toolkit to compare vehicles, track portfolios, and manage automotive investments. Built with modern web technologies, it offers a seamless experience for automotive enthusiasts and investors.

## ✨ Features

### 🏠 Homepage
- **Modern Landing Page**: Clean, responsive design with CARMA branding
- **Vehicle Comparison**: Quick access to compare different vehicles
- **Price Alerts**: Set up notifications for price changes
- **Authentication**: Integrated sign-in/sign-up system with social login options

### 📊 Portfolio Dashboard
- **Vehicle Portfolio Management**: Track your automotive investments
- **Real-time Market Data**: Current values and performance metrics
- **Interactive Charts**: Visualize portfolio performance over time
- **Vehicle Details**: Comprehensive information for each vehicle in your portfolio
- **Add/Remove Vehicles**: Easy portfolio management
- **Export Functionality**: Download portfolio data

### 🔧 Help & Support
- **Contact Form**: Integrated email support system
- **Resend Integration**: Reliable email delivery
- **Responsive Design**: Mobile-friendly support interface
- **Quick Navigation**: Easy access to help resources

### 🎨 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Theme**: Adaptive theming system
- **Smooth Animations**: Polished user interactions
- **Fast Loading**: Optimized performance with Next.js

## 🛠️ Technology Stack

- **Framework**: Next.js 14.2.16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Email Service**: Resend
- **Deployment**: Vercel
- **Version Control**: Git & GitHub

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Markibariki1/Website1.git
   cd Website1
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # Resend API Configuration
   RESEND_API_KEY=your_resend_api_key_here
   RESEND_TO_EMAIL_ADDRESS=your_email@example.com
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
Website Homepage/
├── app/                    # Next.js App Router
│   ├── help/              # Help & Support page
│   ├── portfolio/         # Portfolio dashboard
│   ├── actions/           # Server actions
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── ui/                # Reusable UI components
│   ├── contact-form.tsx   # Contact form
│   ├── mobile-menu.tsx    # Mobile navigation
│   └── ...                # Other components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── public/                # Static assets
└── styles/                # Additional styles
```

## 🔧 Configuration

### Email Setup (Resend)
1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Add your domain (for production)
4. Update environment variables

### Authentication
- Integrated auth system with social login
- Form validation and error handling
- Secure session management

## 📱 Pages & Routes

- **`/`** - Homepage with vehicle comparison and features
- **`/portfolio`** - Portfolio dashboard and management
- **`/help`** - Help & Support with contact form
- **`/compare`** - Vehicle comparison (via modal)
- **`/alerts`** - Price alerts (via modal)
- **`/settings`** - User settings (placeholder)

## 🎯 Key Features Implemented

### ✅ Completed
- [x] Modern homepage with hero section
- [x] Portfolio dashboard with vehicle management
- [x] Help & Support page with contact form
- [x] Authentication system with social login
- [x] Responsive mobile navigation
- [x] Email integration with Resend
- [x] Clickable logo navigation
- [x] Dark/light theme support
- [x] Performance optimizations

### 🔄 In Progress
- [ ] Vehicle comparison functionality
- [ ] Price alerts system
- [ ] User settings page
- [ ] Advanced portfolio analytics

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on every push

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Email service by [Resend](https://resend.com/)
- Deployed on [Vercel](https://vercel.com/)

## 📞 Support

For support, email support@carma.com or use the contact form on the Help & Support page.

---

**CARMA** - *The complete platform to compare vehicles and manage automotive investments.*
