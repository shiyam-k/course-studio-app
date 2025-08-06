// StudioProvider.jsx
import { createContext, useState, useMemo, useCallback } from "react";

const StudioContext = createContext({});

export const StudioProvider = ({ children }) => {
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [blockName, setBlockName] = useState("");
  const [courseId, setCourseId] = useState("")
  const [weekName, setWeekName] = useState("")
  const [moduleName, setModuleName] = useState("")


  const addBlockName = useCallback((value) => {
    setBlockName(value);
  }, []);

  const addCourseId =useCallback((value) => {
    setCourseId(value)
  })

  const addWeekName = useCallback((value) => {
    setWeekName(value)
  })

  const addModuleName = useCallback((value) => {
    setModuleName(value)
  })

  const contextValue = useMemo(
    () => ({
      sidebarWidth,
      setSidebarWidth,
      isSidebarOpen,
      setIsSidebarOpen,
      chatWidth: isSidebarOpen ? `calc(100vw - ${sidebarWidth}px)` : "100vw",
      blockName,
      addBlockName,
      courseId, addCourseId,
      weekName, addWeekName,
      moduleName, addModuleName
    }),
    [sidebarWidth, isSidebarOpen, blockName, courseId, weekName, moduleName]
  );

  return (
    <StudioContext.Provider value={contextValue}>
      {children}
    </StudioContext.Provider>
  );
};

export default StudioContext;