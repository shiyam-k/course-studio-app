import React from 'react';
import './ShinyText.css';
import { useColorScheme } from '@mui/joy/styles';

const ShinyText = ({ text, disabled = false, speed = 5, className = '' }) => {
  const { mode } = useColorScheme(); // 'light' or 'dark'
  const themeClass = mode === 'dark' ? 'shiny-text-dark' : 'shiny-text-light';
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`shiny-text ${themeClass} ${disabled ? 'disabled' : ''} ${className}`}
      style={{ animationDuration }}
    >
      {text}
    </span>
  );
};

export default ShinyText;
