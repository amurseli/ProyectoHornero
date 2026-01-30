// Google OAuth utility functions for authentication

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Initiate Google OAuth login flow
 * Redirects user to backend OAuth endpoint which redirects to Google
 */
export const initiateGoogleLogin = () => {
  window.location.href = `${API_URL}/oauth2/authorization/google`;
};

/**
 * Handle OAuth2 redirect callback
 * This should be called on the OAuth2 redirect page
 * Uses the refresh endpoint to validate the JWT cookie and get user data
 * @returns {Object|null} User data if successful, null otherwise
 */
export const handleOAuth2Redirect = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get('success');
  const error = urlParams.get('error');

  if (error) {
    console.error('OAuth2 error:', error);
    return { error };
  }

  if (success === 'true') {
    // JWT token is already in HttpOnly cookie, use refresh endpoint to get user data
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();

        // Just return user data - UserProvider context will handle storing it
        return { success: true, user: userData };
      } else {
        return { error: 'Failed to fetch user data' };
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { error: error.message };
    }
  }

  return null;
};

/**
 * Logout from Google OAuth
 * Clears HttpOnly cookies via backend and redirects to login
 * Note: User state is managed by UserProvider context, not localStorage
 */
export const logoutGoogle = async () => {
  try {
    // Call backend logout endpoint to clear HttpOnly cookie
    await fetch(`${API_URL}/api/users/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Error during logout:', error);
  }

  // Redirect to login page (UserProvider will clear user state on next mount)
  window.location.href = '/login';
};

export default {
  initiateGoogleLogin,
  handleOAuth2Redirect,
  logoutGoogle
};
