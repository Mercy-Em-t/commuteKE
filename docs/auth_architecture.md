# Authentication Architecture: The SPA State "Wall"

## Overview
TransitOS utilizes a **Single Page Application (SPA)** architecture powered by React, coupled with Supabase for backend authentication. This document outlines a unique architectural feature regarding how session state is handled between the browser and the router during OTP verification.

## The JWT "Invisible Storage" Feature
In traditional multi-page web applications, submitting a login form triggers a hard page reload from the server. If authentication is successful, the server responds with a `302 Redirect` to the dashboard.

In TransitOS, authentication happens completely asynchronously via API calls. 

When a user submits an OTP code on the Login screen, the following sequence occurs:
1. **Cryptographic Validation:** The React frontend transmits the code to Supabase GoTrue.
2. **Token Issuance:** Supabase verifies the code and issues a secure JSON Web Token (JWT).
3. **Invisible Persistence:** The browser intercepts this JWT and silently saves it into HTML5 `localStorage`. 

> **The Security Wall:** At this exact moment, the user is cryptographically authenticated. However, because React is a Single Page Application, the UI does not automatically change. The user hits a "Wall" where they are logged in globally, but the UI remains static on the Login screen. 

## Router Injection
To cross this "Wall", TransitOS implements explicit Router Injection.

Once the asynchronous `verifyOtp()` promise resolves successfully, we manually instruct the browser's navigation API to trigger a redirect:
```javascript
window.location.href = '/admin';
```

### Why is this a feature?
This decoupling of **Authentication State** (JWT in localStorage) and **UI State** (the active React route) provides extreme resilience:
- If a user loses internet connection exactly as they hit the "Wall", they don't lose their login state. The JWT is already saved.
- If the browser crashes, the user can re-open the browser, navigate straight to `/admin`, and the `<ProtectedRoute>` component will instantly read the JWT from `localStorage` and grant them access without requiring another OTP.
- It prevents unauthorized access by ensuring that only explicit, programmed UI transitions occur after cryptographic checks pass.
