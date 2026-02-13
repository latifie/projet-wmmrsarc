import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        let newSocket;

        if (isAuthenticated && user) {
            const accessToken = localStorage.getItem('accessToken');
            newSocket = io(import.meta.env.VITE_API_URL || '', {
                auth: { token: accessToken }
            });

            newSocket.on('connect', () => {
                console.log('Socket connected');
            });

            newSocket.on('online_users', (users) => {
                setOnlineUsers(users);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            setSocket(newSocket);
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setOnlineUsers([]);
            }
        }

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [isAuthenticated, user?.id]); // Re-connect if user changes

    const value = {
        socket,
        onlineUsers,
        isOnline: (userId) => onlineUsers.includes(userId)
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
