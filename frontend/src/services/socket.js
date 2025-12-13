// src/services/socket.js
import { io } from "socket.io-client";

/**
 * Socket.io client – connects to the backend server you posted.
 * 
 * - autoConnect: false → we connect manually in StudentDashboard
 * - withCredentials: true → sends cookies / auth
 */
const socket = io("https://tvt-internship-platform.onrender.com/api", {
  withCredentials: true,
  autoConnect: false,
});

export default socket;