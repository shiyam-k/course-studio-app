import { createContext, useState, useEffect, useMemo } from "react";

const UserInputContext = createContext({});

export const UserInputProvider = ({ children }) => {
  const [formData, setFormData] = useState({});

  const [activeStep, setActiveStep] = useState(0);

  const [modelType, setModelType] = useState(0);
  const [courseModel, setCourseModel] = useState('')
  const [isOllama, setIsOllama] = useState(false)
  const [apiUrl, setApiUrl] = useState('')


  const addModelType = (value) => {
    setModelType(value)
  }

  const addCourseModel = (value) => {
    setCourseModel(value)
  }

  const changeActiveStep = (step) => {
    setActiveStep(step);
  };

  const addIsOllama = (value) => {
    setIsOllama(value)
  }

  const addAPIURL = (value) => {
    setApiUrl(value)
  }

  const contextValue = useMemo(
    () => ({
      activeStep, changeActiveStep,
      modelType, addModelType,
      courseModel, addCourseModel,
      isOllama, addIsOllama,
      apiUrl, addAPIURL,
      formData,
      setFormData,
    }),
    [formData, , activeStep, modelType, courseModel, isOllama, apiUrl]
  );
  // console.log(formData)

  return (
    <UserInputContext.Provider value={contextValue}>
      {children}
    </UserInputContext.Provider>
  );
};

export default UserInputContext;
