import CourseStatusContext from './CourseStatusProvider';
import React, {useContext} from 'react';

const useCourseStatus = () => {
  return useContext(CourseStatusContext);
};

export default useCourseStatus;