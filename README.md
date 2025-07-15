# GraphQL Profile Page

A student profile dashboard that displays personal information and statistics from a GraphQL API using JWT authentication and SVG visualizations.

## Features

- **JWT Authentication** - Secure login with username/email and password
- **Profile Information** - Display user details, XP amount, and grades
- **Interactive Charts** - SVG-based visualizations including:
  - XP progress over time (line chart)
  - Project pass/fail ratio (pie chart)
  - Audit ratio statistics
- **Responsive Design** - Mobile-friendly interface
- **Real-time Data** - Live GraphQL queries

## Project Structure

```
.
├── README.md
├── index.html
├── assets/
│   └── vb.svg
├── charts/
│   └── visualization.js
├── scripts/
│   ├── app.js
│   ├── authentication.js
│   ├── dashboard.js
│   └── dataService.js
├── styles/
│   ├── global.css
│   └── auth.css
├── favicon.ico
└── package-lock.json
```

## Technologies

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API**: GraphQL with JWT authentication
- **Charts**: Custom SVG visualizations
- **Hosting**: GitHub Pages

## Setup Instructions

### 1. Configure API Endpoint

Replace `((DOMAIN))` with your actual domain in:

- `scripts/authentication.js`
- `scripts/dataService.js`

### 2. Local Development

**Using Python:**

```bash
python -m http.server 8000
```

**Using Node.js:**

```bash
npx serve .
```

**Using VS Code:**

- Install Live Server extension
- Right-click `index.html` → "Open with Live Server"

### 3. Access Application

Open browser and navigate to `http://localhost:8000`

## Deployment

### GitHub Pages

1. Push code to GitHub repository
2. Go to Settings → Pages
3. Select source branch (main)
4. Site available at `https://SaddamHosyn.github.io/graphql`

## Usage

1. **Login** - Enter credentials
2. **View Profile** - See user information and XP
3. **Explore Charts** - Interactive statistics
4. **Logout** - End session securely

## GraphQL Queries

The application uses:

- Normal queries (user info)
- Nested queries (results with user data)
- Queries with arguments (filtered objects)

## API Endpoints

- **Authentication**: `https://YOUR_DOMAIN/api/auth/signin`
- **GraphQL**: `https://YOUR_DOMAIN/api/graphql-engine/v1/graphql`

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

Educational project for GraphQL learning curriculum.
