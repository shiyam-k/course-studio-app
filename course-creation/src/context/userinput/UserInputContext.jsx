import { useContext } from 'react';
import UserInputContext from './UserInputProvider';

const useInputContext = () => {
  return useContext(UserInputContext);
};

export default useInputContext;