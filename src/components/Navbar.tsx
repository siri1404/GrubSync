import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <Utensils className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary">GrubSync</span>
        </Link>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-neutral-600 hidden md:inline-block">
                Hello, {user?.name}
              </span>
              <button 
                onClick={handleLogout}
                className="text-neutral-600 hover:text-primary transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/signin" 
                className="text-neutral-600 hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="btn-primary"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};