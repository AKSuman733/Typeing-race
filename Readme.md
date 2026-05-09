# ⚔️ Last Typist Standing

A fast-paced multiplayer typing battle game where players are divided into two teams and compete in real-time.

---

# 🎮 Game Overview

Players join a room and are automatically assigned to either:

* 🔴 Red Team
* 🔵 Blue Team

The host starts the match.

A random word appears on screen.

Players must type the word as fast as possible.

The first correct player attacks the enemy team.

The team whose HP reaches **0 first loses**.

---

# ✨ Features

* Real-time multiplayer gameplay
* Team battles
* Host-based lobby system
* Countdown before game starts
* Combo streak system
* HP bars
* Sound effects
* Screen shake & animations
* Live player list
* Responsive modern UI

---

# 🕹️ How To Play

## 1. Join a Room

Enter:

* Username
* Room ID

Then click:

```txt
Join Battle
```

Players with the same Room ID join the same match.

---

## 2. Host Starts The Match

The first player joining becomes the 👑 Host.

Only the host can:

```
Start Game
```

Other players will see:

```
Waiting for host to start...
```

---

## 3. Countdown Begins

Before the match starts:

5, 4, 3, 2, 1...


Then the battle begins.

---

## 4. Type The Word Fast

A random word appears.

Example:

``
LIGHTNING
``

Type it correctly as fast as possible.

---

## 5. First Correct Player Attacks

Only the FIRST correct player attacks on opposite team.

Enemy team HP decreases.

---

## 6. Wrong Answers

Typing the wrong word:

* Resets combo streak
* Plays error sound

---

# 🔥 Combo System

Consecutive correct answers increase damage.

| Combo | Damage |
| ----- | ------ |
| 1-2   | 5      |
| 3-4   | 10     |
| 5+    | 15     |

Example:

```
AKS is on 5 streak!
```

---

# 🏆 Winning

Each team starts with:

```
200 HP
```

The first team reaching:

```
0 HP
```

loses the match.

Winner screen appears at the end.

---

# 🧱 Tech Stack

## Frontend

* React
* Vite
* Tailwind CSS
* Framer Motion
* Socket.IO Client

## Backend

* Node.js
* Express
* Socket.IO

---

# 📦 Installation

## Clone Project

```
git clone <your-repo-url>
```

---

# 🚀 Backend Setup

## Go to server folder

```
cd server
```

## Install dependencies

``
npm install
```

## Start server

```
npm run dev
```

Server runs on:

```
http://localhost:5000
```

---

# 🚀 Frontend Setup

## Go to client folder

```
cd client
```

## Install dependencies

```
npm install
```

## Start frontend

```
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# 📁 Project Structure

```
client/
 ├── src/
 │   ├── assets/
 │   ├── App.jsx
 │   ├── socket.js
 │   └── index.css

server/
 ├── src/
 │   ├── socket/
 │   ├── rooms/
 │   ├── game/
 │   └── utils/
```

---

# 🔊 Sound Effects

Add sound files inside:

```
client/src/assets/sounds/
```

Required files:

```
attack.mp3
wrong.mp3
countdown.mp3
victory.mp3
```

---

# 🚀 Future Improvements

Planned features:

* Ready system
* Global leaderboard
* Match history
* Database support
* Powerups
* Live chat
* WPM tracking
* Ranked matchmaking
* Mobile optimization
* Private rooms

---

# 👑 Credits

Built with ❤️ using React + Socket.IO.
