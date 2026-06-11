import { useEffect, useState, useRef, useCallback } from "react";
import socket from "../socket";
import { EPHEMERAL_MS, INITIAL_GAME_STATE, SESSION_KEY } from "../config/gameConfig";

import attackSound from "../assets/sounds/attack.mp3";
import wrongSound from "../assets/sounds/wrong.mp3";
import countdownSound from "../assets/sounds/countdown.mp3";
import victorySound from "../assets/sounds/victory.mp3";
import { prepareAudio, playSound } from "../utils/soundManager";

const SOUNDS = {
  attack: attackSound,
  wrong: wrongSound,
  countdown: countdownSound,
  victory: victorySound,
};

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(username, roomId) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username, roomId }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function useGameSocket() {
  const saved = readSession();

  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [username, setUsername] = useState(saved?.username || "");
  const [roomId, setRoomId] = useState(saved?.roomId || "");
  const [shake, setShake] = useState(false);
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [flash, setFlash] = useState({ roundWinner: "", comboMessage: "" });
  const [socketId, setSocketId] = useState(socket.id || "");

  const previousCountdown = useRef(null);
  const shakeTimer = useRef(null);
  const flashTimer = useRef(null);
  const roomIdRef = useRef(saved?.roomId || "");
  const usernameRef = useRef(saved?.username || "");
  const attemptedReconnect = useRef(false);

  const primeAudio = useCallback(() => {
    prepareAudio(SOUNDS).catch(() => {});
  }, []);

  const playWrongFeedback = useCallback(() => {
    playSound("wrong");
    clearTimeout(shakeTimer.current);
    setShake(true);
    shakeTimer.current = setTimeout(() => setShake(false), 250);
  }, []);

  const playAttackFeedback = useCallback(() => {
    playSound("attack");
  }, []);

  const playVictoryFeedback = useCallback(() => {
    playSound("victory");
  }, []);

  const showFlash = useCallback((roundWinner, comboMessage) => {
    if (!roundWinner && !comboMessage) return;

    setFlash({ roundWinner, comboMessage });
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => {
      setFlash({ roundWinner: "", comboMessage: "" });
    }, EPHEMERAL_MS);
  }, []);

  const handleCountdownChange = useCallback((countdown) => {
    if (countdown === null || countdown === undefined) {
      previousCountdown.current = null;
      return;
    }

    if (countdown === previousCountdown.current) return;

    previousCountdown.current = countdown;
    playSound("countdown");
  }, []);

  const applyState = useCallback(
    (state) => {
      if ("countdown" in state) {
        handleCountdownChange(state.countdown);
      }

      showFlash(state.roundWinner, state.comboMessage);
      setGameState((prev) => ({ ...prev, ...state }));
    },
    [showFlash, handleCountdownChange]
  );

  useEffect(() => {
    prepareAudio(SOUNDS).catch(() => {});

    const onGameState = (state) => applyState(state);

    const onGameDelta = (patch) => {
      if ("countdown" in patch) {
        handleCountdownChange(patch.countdown);
      }
      setGameState((prev) => ({ ...prev, ...patch }));
    };

    const onGameUpdate = (event) => {
      switch (event.type) {
        case "correct":
          playAttackFeedback();
          break;
        case "wrong":
          playWrongFeedback();
          break;
        case "victory":
          playVictoryFeedback();
          break;
        default:
          break;
      }
    };

    const onJoinError = (message) => {
      setJoinError(message);
      setJoined(false);
      clearSession();
    };

    const onConnect = () => {
      setSocketId(socket.id);

      const session = readSession();
      if (!session || attemptedReconnect.current) return;

      attemptedReconnect.current = true;
      usernameRef.current = session.username;
      roomIdRef.current = session.roomId;
      setUsername(session.username);
      setRoomId(session.roomId);
      socket.emit("rejoin_room", session);
      setJoined(true);
    };

    socket.on("connect", onConnect);
    socket.on("game_state", onGameState);
    socket.on("game_delta", onGameDelta);
    socket.on("game_update", onGameUpdate);
    socket.on("error_message", onJoinError);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("game_state", onGameState);
      socket.off("game_delta", onGameDelta);
      socket.off("game_update", onGameUpdate);
      socket.off("error_message", onJoinError);
      clearTimeout(shakeTimer.current);
      clearTimeout(flashTimer.current);
    };
  }, [
    applyState,
    handleCountdownChange,
    playWrongFeedback,
    playAttackFeedback,
    playVictoryFeedback,
  ]);

  const handleJoin = () => {
    if (!username.trim() || !roomId.trim()) return;

    primeAudio();

    setJoinError("");
    usernameRef.current = username.trim();
    roomIdRef.current = roomId.trim();
    writeSession(usernameRef.current, roomIdRef.current);
    socket.emit("join_room", {
      username: usernameRef.current,
      roomId: roomIdRef.current,
    });
    setJoined(true);
  };

  const toggleReady = () => {
    primeAudio();
    socket.emit("toggle_ready", { roomId: roomIdRef.current });
  };

  const startGame = () => {
    primeAudio();
    socket.emit("start_game", { roomId: roomIdRef.current });
  };

  const restartGame = () => {
    primeAudio();
    socket.emit("restart_game", { roomId: roomIdRef.current });
  };

  const submitWord = (word) => {
    socket.emit("submit_word", {
      roomId: roomIdRef.current,
      word,
    });
  };

  return {
    joined,
    joinError,
    username,
    setUsername,
    roomId,
    setRoomId,
    shake,
    gameState,
    flash,
    handleJoin,
    toggleReady,
    startGame,
    restartGame,
    submitWord,
    primeAudio,
    socketId,
  };
}
