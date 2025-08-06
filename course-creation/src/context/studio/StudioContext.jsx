import { useContext } from 'react';
import StudioContext from './StudioProvider'; // Ensure this points to the correct file

const useStudioContext = () => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudioContext must be used within a StudioProvider');
  }
  return context;
};

export default useStudioContext;