import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { CssVarsProvider } from "@mui/joy/styles";
import theme from "./styles/theme";
import { UserInputProvider } from "./context/userinput/UserInputProvider";
import { CourseStatusProvider } from "./context/coursestatus/CourseStatusProvider";
import { GenaiStatusProvider } from "./context/genaicourse/GenaiProvider";
import { StudioProvider } from "./context/studio/StudioProvider";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <CssVarsProvider theme={theme}>
      <UserInputProvider>
        <CourseStatusProvider>
          <GenaiStatusProvider>
            <StudioProvider>
              <App />
            </StudioProvider>
          </GenaiStatusProvider>
        </CourseStatusProvider>
      </UserInputProvider>
    </CssVarsProvider>
  </React.StrictMode>
);

reportWebVitals();
