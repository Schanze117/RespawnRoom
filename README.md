# RespawnRoom

**Live Project:** [RespawnRoom](https://respawnroom-client.onrender.com/)

## Table of Contents
- [Overview](#overview)
- [Description](#description)
- [Screenshot & Project Link](#screenshot--project-link)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [What We Learned](#what-we-learned)
- [Project Highlights](#project-highlights)
- [Areas for Improvement](#areas-for-improvement)
- [How to Contribute](#how-to-contribute)
- [Credits/Team](#creditsteam)
- [License](#license)

## Overview

RespawnRoom is your all-in-one gaming hub that streamlines discovering, organizing, and managing your gaming collection. Find new titles, curate wishlists, track your backlog and connect with friends.

## Description

Built with the MERN stack (MongoDB, Express, React, Node.js) and GraphQL, RespawnRoom offers a seamless platform for gamers featuring game discovery, social networking, and collection management. It integrates with IGDB for comprehensive game data and implements a token-based recommendation system that improves personalized suggestions over time.

Security is prioritized through JWT authentication, password hashing with bcrypt, and CORS protection. The social networking component enables real-time messaging via PubNub, creating a community where sharing recommendations and tracking friends' gaming activities becomes effortless.

## Screenshot & Project Link

<img width="951" alt="RespawnRoom Screenshot" src="https://github.com/user-attachments/assets/1de82e68-2dd5-4cd6-8aa1-ac0cfe2e4e78" />

## Key Features

- **User Authentication**: Secure login with email/password or Google OAuth integration
- **Game Discovery**: Search the IGDB database for games with cover art and details
- **Game Collection**: Save favorite games to your personal collection
- **Social Networking**: Add friends, accept/decline friend requests
- **Real-time Chat**: Message friends through PubNub integration
- **GraphQL API**: Efficient data fetching with Apollo Client/Server
- **Responsive Design**: Mobile-friendly UI built with React and Tailwind CSS
- **Security**: JWT authentication, password encryption, and rate limiting

## Tech Stack

### Frontend
- React, Vite, Apollo Client, React Router, Tailwind CSS
- PubNub for real-time messaging, JWT for authentication
- Lazy loading and code splitting for optimized performance

### Backend
- Node.js, Express, Apollo Server (GraphQL)
- MongoDB with Mongoose for data modeling
- JWT, Passport.js with Google OAuth, bcrypt for security
- CORS and rate limiting for protection

### External APIs
- IGDB for game data
- Google OAuth for authentication
- PubNub for real-time messaging

## Installation

```bash
# Clone and navigate
git clone https://github.com/Schanze117/RespawnRoom.git
cd RespawnRoom

# Install dependencies
npm install

# Set up .env with required variables

# Start development server
npm run start:dev
```

## Usage

- **Find Games**: Search the IGDB database for titles
- **Save Games**: Add games to your personal collection
- **Connect**: Add friends and chat in real-time
- **Authenticate**: Sign in with email or Google account
- **Browse**: Explore game recommendations on the home page


## What We Learned

- GraphQL provides more efficient data fetching than REST
- Authentication security requires multiple protection layers
- Real-time features present unique scalability challenges
- MongoDB schema design needs careful planning for performance
- Modern React patterns improve maintainability and performance
- API integration requires handling rate limits and data formatting
- Collaborative development demands clear communication

## Project Highlights

### Technical Excellence
- **Dual Authentication**: Implementation of both JWT and Google OAuth
- **GraphQL API**: Well-structured schemas and resolvers
- **Real-time Messaging**: PubNub integration for friend chat
- **Component Architecture**: Modular React components with lazy loading
- **MongoDB Integration**: Efficient data models with Mongoose

### Dev Skills
- **Full-Stack Development**: Proficiency across React, Node.js, GraphQL, and MongoDB
- **Security Implementation**: Authentication, encryption, and API protection
- **Third-Party Integration**: IGDB, Google OAuth, and PubNub APIs
- **Modern Frontend**: React with Hooks, Context API, and Tailwind CSS
- **Clean Code**: Organized directory structure and consistent patterns

## Areas for Improvement

- Expand test coverage for better reliability
- Add internationalization support
- Integrate analytics for usage insights
- Add content moderation for user communications

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature-name`)
5. Open a Pull Request

## Credits/Team

- **Jonathan Correa** - [GitHub](https://github.com/xPandemonium)  
  UX/UI Design • React/Tailwind • YouTube Integration • API Integration • Documentation Research

- **Saleh Farah** - [GitHub](https://github.com/sfar93)  
  Authentication • Twitch API Integration • API Security • Testing/QA

- **James Boulden** - [GitHub](https://github.com/JamixB97)  
  Search & Discover Functionality • Game Saving • MongoDB/GraphQL Migration • Database Administration

- **Aaron Schanzenbach** - [GitHub](https://github.com/Schanze117)  
  Project Management • Authentication • Sprint Planning • Timeline Management • Team Coordination

- **Mahdi Ghaleb** - [GitHub](https://github.com/Mahdi-196)  
  Google Auth Integration • AWS Deployment • Home Page Logic and Design • PubNub Real-Time Chat • Performance Optimization • Documentation

### External Resources
- [Tailwind CSS](https://tailwindcss.com/)
- [Twitch API](https://dev.twitch.tv/docs/api/)
- [Google API](https://developers.google.com/identity/sign-in/web/sign-in)
- [IGDB](https://www.igdb.com/)
- [PubNub](https://www.pubnub.com/)

## License

This project is licensed under the [MIT License](LICENSE).
