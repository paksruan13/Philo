import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const backend_url = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4243';

export const useSocket = () => {
    const[socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(backend_url, {
            transports: ['websocket'],
            timeout: 20000,
        });
    
    newSocket.on('connect', () => {
        setConnected(true);
        newSocket.emit('join-leaderboard');
    });

    newSocket.on('disconnect', () => {
        setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setConnected(false);
    });

    setSocket(newSocket);

    return () => {
        newSocket.close();
    };
}, []);

    return { socket, connected };

};