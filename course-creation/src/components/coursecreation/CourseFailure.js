import React from 'react';
import { Alert, Stack, Typography } from '@mui/joy';
import { ErrorOutline } from '@mui/icons-material';
import theme from '../../styles/theme';
import useCourseStatus from '../../context/coursestatus/CourseStatusContext';

const CourseFailureAlert = ({state}) => {

  return (
    <Alert
      variant="outlined"
      startDecorator={<ErrorOutline />}
      sx={{
        borderRadius: theme.radius.xs,
        padding: '16px',
        border: `.1px solid ${theme.vars.palette.danger[400]}`,
      }}
      aria-label="Course generation failure alert"
    >
      <Stack spacing="8px">
        <Typography level="h4" sx={{ color: theme.vars.palette.text.primary }}>
          Course Generation Failed
        </Typography>
        <Typography level="body1" sx={{ color: theme.vars.palette.text.secondary }}>
          {state.error === 'WebSocket connection closed' || state.error === 'WebSocket error occurred'
            ? 'Failed to connect to the server. Please check your connection or try again later.'
            : `Error: ${state.error}`}
        </Typography>
      </Stack>
    </Alert>
  );
};

export default CourseFailureAlert;