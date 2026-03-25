import { createContext } from 'react';
import type { AuthContextType } from '../types';

export const AuthContext = createContext<AuthContextType | null>(null);
export type { AuthContextType } from '../types';
