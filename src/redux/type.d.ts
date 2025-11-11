import {reduxStore} from "./store/store";

export interface IAuth {
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: string;
    refreshTokenExpires: string;
    consultantId: number;
}

export interface IAuthUserState {
    user: IAuth | null;
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
}


interface LoginCredentials {
    email: string;
    password: string;
}

const userRole = {
    Admin: 'Admin',
    User: 'User',
    Manager: 'Manager',
    Consultant: 'Consultant',
}

interface RegisterCredentials {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    password: string;
    userRole?: keyof typeof userRole
}

export type RootState = ReturnType<typeof reduxStore.getState>

export type AppDispatch = typeof reduxStore.dispatch