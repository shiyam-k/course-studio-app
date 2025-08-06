import React from 'react';
import Navbar from './components/TopNavbar';
import { useColorScheme } from '@mui/joy';
import StepperComponent from './components/userinputs/InputStepper';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CourseGenerateButton } from './components/coursecreation/CreateCourse';
import CourseList from './components/coursestudio/CourseDashboard';
import { useLocation } from 'react-router-dom';
import StudioSidebar from './components/coursestudio/CourseSidebar';
import CourseStudio from './components/coursestudio/CourseStudio';

const App = () => {
  const { mode, setMode } = useColorScheme();
  return (
    <BrowserRouter>
      <main
        style={{
          backgroundColor: 'var(--joy-palette-background-body)',
          minHeight: '100vh',
        }}
      >
        <Navbar />
        <Routes>
          <Route path="/create-course" element={<StepperComponent />} />
          <Route path="/authentication" element={<CourseGenerateButton />} />
          <Route path="/course-dashboard" element={<CourseList />} />
          <Route path="/studio/:courseId" element={<CourseStudioWrapper />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
};


const CourseStudioWrapper = () => {
  const location = useLocation();
  const { courseData } = location.state || {}; 

  return <CourseStudio data={courseData} />;
};


export default App;
