# Gmail Statistics Dashboard

A full-stack MERN Gmail Statistics Dashboard featuring JWT-based authentication, Google OAuth integration, Gmail API analytics, recent email retrieval, and interactive data visualization using React, Express, MongoDB, and Recharts.

## Project Structure
```
fullstack/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/         # Page components (SignUp, SignIn, Dashboard)
│   │   ├── App.jsx        # Main app component with React Router
│   │   ├── main.jsx       # Entry point
│   │   ├── App.css        # Styling
│   │   └── index.css      # Global styles
│   ├── index.html         # HTML entry point
│   ├── vite.config.js     # Vite configuration
│   └── package.json       # Client dependencies
├── server/                # Express backend
│   ├── models/
│   │   └── User.js        # Mongoose User schema
│   ├── routes/
│   │   └── auth.js        # Authentication routes
│   ├── index.js           # Express server setup
│   ├── .env               # Environment variables
│   └── package.json       # Server dependencies
├── package.json           # Root monorepo config
└── .gitignore            # Git ignore file
```


5. Add refresh tokens for better security

## License

MIT

