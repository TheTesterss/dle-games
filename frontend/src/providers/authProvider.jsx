import { useState } from "react";
import { AuthContext } from "src/contexts/authContext";
import SessionManager from "src/utils/Session";

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
    const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('currentUser')) || null);

    const session = new SessionManager();

    const login = (userData) => {
        if(!session.isValid()) {
            // Backend login logic


            session.create(userData)
            setIsAuthenticated(true)
            return null;
        }
        setIsAuthenticated(true);
        // fetch user data from the backend
        setCurrentUser(null);
    }

    const logout = () => {
        if(session.isValid()) {
            session.destroy();
            setIsAuthenticated(false);
            setCurrentUser(null);
        }
    }

    const register = () => {
        // Register using backend
        setIsAuthenticated(true);
        setCurrentUser(null);
    }

    return (
        <AuthContext.Provider value={{ session, isAuthenticated, currentUser, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};