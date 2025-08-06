import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/joy';

const GoogleLogin = ({ onLogin }) => {
  const buttonDiv = useRef(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (typeof window.google === 'undefined' || !window.google.accounts) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    } else {
      initializeGoogleSignIn();
    }
  }, []);

  const initializeGoogleSignIn = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: '533029501851-gm716t845l1hkfp1pk95b25l74ssprjj.apps.googleusercontent.com',
          callback: handleCredentialResponse,
        });
        window.google.accounts.id.renderButton(buttonDiv.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
        });
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
      }
    } else {
      console.error('Google Identity Services library not loaded correctly.');
    }
  };

  const handleCredentialResponse = (response) => {
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const userData = JSON.parse(jsonPayload);
    onLogin({
      token: response.credential,
      user: {
        email: userData?.email,
        name: userData.name || 'User',
        picture: userData.picture || '',
      },
    });
  };

  return <Box ref={buttonDiv} sx={{ mt: 2 }} />;
};

export default GoogleLogin;