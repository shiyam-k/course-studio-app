import React, { useState, useCallback } from 'react';
import { Box } from '@mui/joy';
import { styled } from '@mui/joy/styles';
import StudioSidebar from './CourseSidebar';
import CourseChat from './CourseChat';
import theme from '../../styles/theme';

// Styled components
const StudioContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: 'calc(95vh)',
  width: '99vw',
  backgroundColor: theme.palette.background.popup,
  position: 'relative',
  top: 5,
  overflow: 'hidden',
  boxSizing: 'border-box',
}));

const CourseStudio = ({ data }) => {
  const [sidebarWidth, setSidebarWidth] = useState(350);

  const handleSidebarWidthChange = useCallback((newWidth) => {
    setSidebarWidth(newWidth);
  }, []);

  return (
    <StudioContainer>
      <StudioSidebar data={data} onWidthChange={handleSidebarWidthChange} />
      <CourseChat/>
    </StudioContainer>
  );
};

export default CourseStudio;