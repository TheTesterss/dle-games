import { useContext } from "react";
import { AuthContext } from "src/contexts/authContext";

export const useAuth = () => useContext(AuthContext);