# Realtime Architecture: WebSockets & Resilience

## Overview
TransitOS relies heavily on live data synchronization for both the passenger tracking map and the Sacco administration dashboard. To achieve millisecond latency without overwhelming the database, we utilize **Supabase Realtime**, which is built on multiplexed WebSockets.

## Feature: Automatic Exponential Backoff
A major challenge with mobile transport applications is unstable network conditions (e.g., a passenger's bus driving through a tunnel or rural area). 

If a standard HTTP polling mechanism fails, it can freeze the application. In TransitOS, our WebSocket connection employs **Automatic Exponential Backoff**. 
- **The Drop:** If the passenger loses 4G signal, the WebSocket connection drops cleanly.
- **The Backoff:** The client silently attempts to reconnect in the background. It waits 1 second, then 2 seconds, then 4 seconds, scaling exponentially to prevent battery drain.
- **The Reconnect:** The exact millisecond the passenger regains 4G signal, the socket snaps back into place and automatically requests the delta (the missing data) to resynchronize the live map.

## Feature: Multiplexed Broadcasting
When 10,000 passengers are tracking buses simultaneously, we do not open 10,000 direct connections to PostgreSQL.
Instead, all 10,000 WebSockets connect to the Supabase Realtime Server (the middleman). When a driver updates their GPS, it writes to the database exactly *once*. The Realtime Server then multiplexes that single update and broadcasts it down all 10,000 open sockets. This allows the system to scale infinitely without crashing the database.

## Feature: "Permanent Stage" Service Workers & WebPush
Standard WebSockets die the moment the user closes the browser tab. To solve the requirement of alerting a user that their "bus is 10 minutes away" even if they aren't looking at the app, we utilize a **Service Worker**.

A Service Worker is a specialized Javascript file that installs itself directly into the passenger's Operating System (Android, iOS, Windows). 
- It acts in a "Permanent Stage", running in the background independently of the browser.
- It maintains a silent connection to the Push Notification gateway.
- When the backend triggers an alert, the Service Worker wakes up and pushes a native system notification to the user's screen, bringing them back into the app.
