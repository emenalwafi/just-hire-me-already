"use client"

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice'; // Import the action
import type { AppDispatch, RootState } from '@/store/store'; // Import types
import router from 'next/router';

const Home: React.FC = () => {
    const dispatch: AppDispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth.user);

    const handleLogout = () => {
        dispatch(logout());
        router.push('/login')
    };

    return (
        <div>
            {/* ... other header content ... */}
            {user && (
                <button onClick={handleLogout}>
                    Logout ({user.name})
                </button>
            )}
        </div>
    );
};

export default Home;