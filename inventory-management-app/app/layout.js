'use client';  // Enable client-side functionality

import './globals.css';  // Import global CSS

export default function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Inventory Management</title>
        {/* Include Okta Sign-In Widget CSS from CDN */}
        <link
          rel="stylesheet"
          href="https://global.oktacdn.com/okta-signin-widget/5.6.1/css/okta-sign-in.min.css"
        />
      </head>
      <body className="page">
        <div>{children}</div> {/* Render page content here */}
      </body>
    </html>
  );
}
