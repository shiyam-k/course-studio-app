import React, { createContext, useReducer, useCallback, useRef, useEffect, useMemo } from "react";
import useInputContext from "../userinput/UserInputContext";

const GenaiStatusContext = createContext({});

const initialState = {
  progressMap: {
    course_outline: { status: 0, timestamp: null, path: null, error: null },
    course_weeks: { status: 0, timestamp: null, path: null, error: null },
    week_plans: { status: 0, timestamp: null, path: null, error: null },
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
      const stepOrder = ['course_outline', 'course_weeks', 'week_plans', 'course_milestone'];
      const stepIndex = stepOrder.indexOf(action.payload.step);
      const minProgress = stepIndex >= 0 ? ((stepIndex * 1.0 + (action.payload.status === 2 ? 1.0 : action.payload.status === 1 ? 0.5 : 0)) / stepOrder.length) * 100 : state.progress;
      const newProgress = Math.max(state.progress, action.payload.progress ?? minProgress, minProgress);
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
        progress: newProgress,
      };
    case 'SET_ERROR':
      return { ...state, isGenerating: false, error: action.payload, isModalOpen: false };
    case 'SET_COMPLETE':
      return { ...state, isGenerating: false, requestId: action.payload.request_id, progress: 100, error: null, isModalOpen: false };
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

export const GenaiStatusProvider = ({ children }) => {
  const [genaiState, genaiDispatch] = useReducer(reducer, initialState);
  const serviceRef = useRef(null);
  const { formData, apiUrl } = useInputContext();

  const handleProgress = useCallback((data) => {
    console.log("GenaiProvider: Handling progress update:", data);
    genaiDispatch({
      type: "UPDATE_PROGRESS",
      payload: {
        step: data.step,
        status: data.status,
        timestamp: data.timestamp,
        path: data.path,
        error: data.error,
        progress: data.progress ?? 0,
      },
    });
  }, []);

  const handleError = useCallback((error) => {
    console.log("GenaiProvider: Handling error:", error);
    genaiDispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const handleComplete = useCallback((data) => {
    console.log("GenaiProvider: Handling complete:", data);
    genaiDispatch({ type: "SET_COMPLETE", payload: data });
  }, []);

  const startGenaiGeneration = useCallback((data) => {
    console.log("GenaiProvider: Starting generation with data:", data);
    genaiDispatch({ type: "START_GENERATION" });

    const service = new (class {
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
        console.log("GenaiProvider: Connecting to WebSocket:", url);
        this.ws = new WebSocket(url);

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log("GenaiProvider: WebSocket message received:", data);
          if (data.status === "completed") {
            this.onComplete(data);
          } else if (data.status === "error") {
            this.onError(data.error);
          } else if (data.step && data.status !== undefined) {
            this.onProgress(data);
          } else {
            console.warn("GenaiProvider: Unhandled WebSocket message:", data);
          }
        };

        this.ws.onclose = () => {
          console.log("GenaiProvider: WebSocket closed");
          // Only set error if process is not complete
          if (!genaiState.requestId) {
            this.onError("WebSocket connection closed unexpectedly");
          }
        };
        this.ws.onerror = (error) => {
          console.error("GenaiProvider: WebSocket error:", error);
          this.onError("WebSocket error occurred");
        };
      }

      send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          console.log("GenaiProvider: Sending WebSocket data:", data);
          this.ws.send(JSON.stringify(data));
        } else {
          console.error("GenaiProvider: WebSocket not ready");
          this.onError("WebSocket not ready");
        }
      }

      disconnect() {
        if (this.ws) {
          console.log("GenaiProvider: Disconnecting WebSocket");
          this.ws.close();
          this.ws = null;
        }
      }
    })();

    serviceRef.current = service;
    service.connect('ws://localhost:8000/genai-courses/generate', handleProgress, handleError, handleComplete);

    service.ws.onopen = () => {
      console.log("GenaiProvider: WebSocket opened");
      service.send(data);
    };
  }, [handleProgress, handleError, handleComplete]);

  useEffect(() => {
    return () => serviceRef.current?.disconnect();
  }, []);

  useEffect(() => {
    console.log("GenaiProvider: Saving genaiState to localStorage:", genaiState);
    localStorage.setItem("courseGeneratorState", JSON.stringify(genaiState));
  }, [genaiState]);

  useEffect(() => {
    const savedState = localStorage.getItem("courseGeneratorState");
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      Object.entries(parsedState.progressMap).forEach(([step, data]) => {
        genaiDispatch({
          type: "UPDATE_PROGRESS",
          payload: { step, ...data, progress: parsedState.progress || 0 },
        });
      });
      if (parsedState.requestId) {
        genaiDispatch({ type: "SET_COMPLETE", payload: { request_id: parsedState.requestId } });
      }
      if (parsedState.error) {
        genaiDispatch({ type: "SET_ERROR", payload: parsedState.error });
      }
    }
  }, []);

  const contextValue = useMemo(() => ({
    genaiState,
    genaiDispatch,
    startGenaiGeneration,
  }), [genaiState, startGenaiGeneration]);

  return (
    <GenaiStatusContext.Provider value={contextValue}>
      {children}
    </GenaiStatusContext.Provider>
  );
};

export default GenaiStatusContext;