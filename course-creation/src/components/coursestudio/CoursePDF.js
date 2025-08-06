import React, { useState, useCallback } from 'react';
import { IconButton, Alert, CircularProgress } from '@mui/joy';
import { styled } from '@mui/joy/styles';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import theme from '../../styles/theme';

// Styled components
const ConvertButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary[800],
  color: theme.palette.text.inverse,
  padding: theme.spacing(1),
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 600,
  borderRadius: theme.radius.md,
  transition: 'background-color 0.2s ease, transform 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary[600],
    transform: 'scale(1.05)',
  },
  '&:disabled': {
    backgroundColor: theme.palette.neutral[400],
    cursor: 'not-allowed',
  },
}));

const ErrorAlert = styled(Alert)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.danger[100],
  color: theme.palette.danger[800],
  borderRadius: theme.radius.sm,
  padding: theme.spacing(1),
}));

const ConvertToPDFButton = ({ courseId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConvert = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/studio/convert?course_id=${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
        },
      });

      // Check if the response is OK
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Course outline not found for course ID: ${courseId}`);
        } else if (response.status === 400) {
          throw new Error('Invalid course data format');
        } else {
          throw new Error('Failed to generate PDF');
        }
      }

      // Verify content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Received non-PDF response from server');
      }

      // Collect response chunks
      const reader = response.body.getReader();
      const chunks = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
      }

      // Create a single blob from chunks
      const blob = new Blob(chunks, { type: 'application/pdf' });
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }

      // Log blob details for debugging
      console.log('Blob size:', blob.size, 'Blob type:', blob.type);

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${courseId}_outline.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      const errorMessage = err.message || 'Failed to generate PDF. Please try again later.';
      setError(errorMessage);
      console.error('Error converting to PDF:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  return (
    <>
      <ConvertButton
        onClick={handleConvert}
        disabled={loading || !courseId}
        aria-label="Convert course outline to PDF"
      >
        {loading ? <CircularProgress size="sm" /> : <PictureAsPdfIcon />}
      </ConvertButton>
      {error && <ErrorAlert role="alert">{error}</ErrorAlert>}
    </>
  );
};

export default ConvertToPDFButton;