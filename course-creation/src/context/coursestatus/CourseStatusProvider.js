import React, { createContext, useReducer, useCallback, useRef, useEffect, useMemo } from 'react';

const CourseStatusContext = createContext({});

const initialState = {
  progressMap: {
    course_outline: { status: 0, timestamp: null, path: null, error: null },
    course_weeks: { status: 0, timestamp: null, path: null, error: null },
    module_blocks: { status: 0, timestamp: null, path: null, error: null },
    block_metadata: { status: 0, timestamp: null, path: null, error: null },
    week_plans: { status: 0, timestamp: null, path: null, error: null },
    weekly_milestones: { status: 0, timestamp: null, path: null, error: null },
    course_milestone: { status: 0, timestamp: null, path: null, error: null },
  },
  error: null,
  isGenerating: false,
  requestId: null,
  progress: 0,
  isModalOpen: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'START_GENERATION':
      return { ...state, isGenerating: true, error: null, requestId: null, progress: 0, isModalOpen: false };
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progressMap: {
          ...state.progressMap,
          [action.payload.step]: {
            status: action.payload.status,
            timestamp: action.payload.timestamp,
            path: action.payload.path,
            error: action.payload.error,
          },
        },
        progress: action.payload.progress,
      };
    case 'SET_ERROR':
      return { ...state, isGenerating: false, error: action.payload, isModalOpen: false };
    case 'SET_COMPLETE':
      return { ...state, isGenerating: false, requestId: action.payload.request_id, progress: 100, isModalOpen: false };
    case 'RESET':
      return initialState;
    case 'OPEN_MODAL':
      return { ...state, isModalOpen: true };
    case 'CLOSE_MODAL':
      return { ...state, isModalOpen: false };
    default:
      return state;
  }
};

export const CourseStatusProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const serviceRef = useRef(null);
  const isMobile = false; // Assuming non-mobile for styling consistency

  const handleProgress = useCallback((data) => {
    dispatch({
      type: 'UPDATE_PROGRESS',
      payload: {
        step: data.step,
        status: data.status,
        timestamp: data.timestamp,
        path: data.path,
        error: data.error,
        progress: data.progress,
      },
    });
  }, []);

  const handleError = useCallback((error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const handleComplete = useCallback((data) => {
    dispatch({ type: 'SET_COMPLETE', payload: data });
  }, []);

  const startGeneration = useCallback((data) => {
    dispatch({ type: 'START_GENERATION' });
    const courseInput = {
      topic: 'Introduction to NLP from basics',
      experience: 0,
      total_weeks: 4,
      hours_per_week: 5,
      learning_style: 0,
      motivation: 0,
      custom_motivation: '',
    };

    const service = new class {
      constructor() {
        this.ws = null;
        this.onProgress = null;
        this.onError = null;
        this.onComplete = null;
      }

      connect(url, onProgress, onError, onComplete) {
        this.onProgress = onProgress;
        this.onError = onError;
        this.onComplete = onComplete;
        this.ws = new WebSocket(url);

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.status === 'completed') {
            this.onComplete(data);
          } else if (data.status === 'error') {
            this.onError(data.error);
          } else if (data.step && data.progress !== undefined) {
            this.onProgress(data);
          }
        };

        this.ws.onclose = () => {
          this.onError('WebSocket connection closed');
        };

        this.ws.onerror = () => {
          this.onError('WebSocket error occurred');
        };
      }

      send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(data));
        } else {
          this.onError('WebSocket not ready');
        }
      }

      disconnect() {
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
      }
    }();

    serviceRef.current = service;
    service.connect(
      'ws://localhost:8000/courses/generate',
      handleProgress,
      handleError,
      handleComplete
    );

    service.ws.onopen = () => {
      service.send(data);
    };
  }, [handleProgress, handleError, handleComplete]);

  useEffect(() => {
    return () => {
      serviceRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('courseGeneratorState', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const savedState = localStorage.getItem('courseGeneratorState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      Object.entries(parsedState.progressMap).forEach(([step, data]) => {
        dispatch({
          type: 'UPDATE_PROGRESS',
          payload: { step, ...data, progress: parsedState.progress || 0 },
        });
      });
      if (parsedState.requestId) {
        dispatch({ type: 'SET_COMPLETE', payload: { request_id: parsedState.requestId } });
      }
      if (parsedState.error) {
        dispatch({ type: 'SET_ERROR', payload: parsedState.error });
      }
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      startGeneration,
    }),
    [state, startGeneration]
  );

  return (
    <CourseStatusContext.Provider value={contextValue}>
      {children}
    </CourseStatusContext.Provider>
  );
};

export default CourseStatusContext;