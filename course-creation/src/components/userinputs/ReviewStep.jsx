import React, { useEffect, useState } from "react";
import {
  Stack,
  Typography,
  Sheet,
  Button,
  Menu,
  MenuItem,
  ListItemDecorator,
  ListDivider,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/joy";
import { ArrowRight, CheckCircle, ErrorOutline } from "@mui/icons-material";
import { motion } from "framer-motion";
import theme from "../../styles/theme";
import useUserInput from "../../context/userinput/UserInputContext";
import { CourseGenerateButton, CourseProgress } from "../coursecreation/CreateCourse";
import {
  GenaiCourseGenerateButton,
  GenaiCourseProgress,
} from "../coursecreation/GenaiCreateCourse";
import useCourseStatus from "../../context/coursestatus/CourseStatusContext";
import useGenaiStatus from "../../context/genaicourse/GenaiContext";
import CourseFailureAlert from "../coursecreation/CourseFailure";
import CourseSuccessAlert from "../coursecreation/CourseSuccess";

const MODEL_MAP = {
  // 0: "gemini-2.0-flash",
  1: "gemini-2.5-flash",
  gemma: "gemma",
};

const experienceMap = {
  0: "I'm new",
  1: "I've tried it before",
  2: "I'm confident / advanced",
};

const learningStyleMap = {
  0: "Quick Course",
  1: "Skill Path",
  2: "Build-a-Project",
};

const motivationMap = {
  0: "Get a better job",
  1: "College help",
  2: "Just for fun",
  3: "Other",
};

const ReviewStep = ({ stepNumber, onBack }) => {
  const {
    formData,
    modelType,
    courseModel,
    isOllama,
    addIsOllama,
    addModelType,
    addCourseModel,
    addAPIURL,
    apiUrl,
  } = useUserInput();
  const { state } = useCourseStatus();
  const { genaiState } = useGenaiStatus();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const ollamaApiUrl = "http://localhost:11434";

  const getMotivationValue = () => {
    const base = motivationMap[formData?.step5];
    if (formData?.step5 === 3) {
      return formData?.step5Other?.trim()
        ? `Other: ${formData?.step5Other}`
        : "Other (not specified)";
    }
    return base || "Not provided";
  };

  const displayData = {
    "Learning Goal": formData?.learningGoal || "Not provided",
    "Prior Knowledge": experienceMap[formData?.step2] || "Not provided",
    "No. of Weeks": formData?.step3Weeks
      ? `${formData?.step3Weeks} weeks`
      : "Not provided",
    "Study Hours / Week": formData?.step3 || "Not provided",
    "Learning Style": learningStyleMap[formData?.step4] || "Not provided",
    Motivation: getMotivationValue(),
    Structure: formData?.step6 || "Not provided",
  };

  useEffect(() => {
    if (courseModel === "gemma") {
      checkOllamaStatus();
    } else {
      addIsOllama(null);
    }
  }, [courseModel]);

  const checkOllamaStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ollamaApiUrl, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.status === 200 || res.status === 404) {
        addIsOllama(true);
      } else {
        const errorText = await res.text();
        throw new Error(
          `Unexpected status code: ${res.status}. Response: ${errorText}`
        );
      }
    } catch (err) {
      console.error("Error checking Ollama status:", err);
      if (err.name === "AbortError") {
        setError(
          "Ollama is not responding within the timeout period. It might be slow or not running."
        );
      } else if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError")
      ) {
        setError(
          `Failed to connect to Ollama. It might not be running, or there's a CORS issue. Please ensure Ollama is running and accessible at '${ollamaApiUrl}'.`
        );
      } else {
        setError(
          `An error occurred while trying to connect to Ollama: ${err.message}`
        );
      }
      addIsOllama(false);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleModelSelect = (model) => {
    addCourseModel(model);
    addModelType(model === "gemma" ? 1 : 2);
    addAPIURL(
      model === "gemma"
        ? "ws://localhost:8000/courses/generate"
        : "ws://localhost:8000/genai-courses/generate"
    );
    handleMenuClose();
  };

  // Check if all steps in progressMap are complete (status: 2)
  const isGenaiComplete =
    genaiState.requestId &&
    Object.values(genaiState.progressMap).every((step) => step.status === 2);
  const isOllamaComplete =
    state.requestId &&
    Object.values(state.progressMap).every((step) => step.status === 2);
    console.log(isOllamaComplete)

  if (courseModel === "gemma") {
    if (state.isGenerating) {
      return <CourseProgress />;
    }

    if (!isOllamaComplete && !state.isGenerating) {
      return (
        <Stack spacing="24px" alignItems="stretch" p="24px">
          <CourseFailureAlert state={state} />
          <Stack
            direction="row"
            spacing="16px"
            justifyContent="space-between"
            alignItems="center"
          >
            <Button
              variant="outlined"
              color="neutral"
              onClick={onBack}
              sx={{ borderRadius: theme.radius.xs }}
              aria-label="Previous step"
            >
              Back
            </Button>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Stack
                direction="row"
                spacing="8px"
                alignItems="center"
                sx={{
                  backgroundColor: theme.vars.palette.background.level1,
                  borderRadius: theme.radius.xs,
                  padding: "8px",
                  boxShadow: theme.shadow.xs,
                }}
              >
                <Button
                  variant="outlined"
                  color="neutral"
                  onClick={handleMenuOpen}
                  sx={{
                    borderRadius: theme.radius.xs,
                    py: "4px",
                    "&:hover": {
                      backgroundColor: theme.vars.palette.neutral[100],
                    },
                  }}
                  aria-label="Select model"
                  aria-controls={anchorEl ? "model-selector-menu" : undefined}
                  aria-haspopup="true"
                >
                  {MODEL_MAP[courseModel] || "Select Model"}
                </Button>
                <Menu
                  id="model-selector-menu"
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  sx={{
                    borderRadius: theme.radius.xs,
                    "--ListItemDecorator-size": "24px",
                  }}
                >
                  <MenuItem
                    disabled
                    sx={{
                      fontWeight: "600",
                      color: theme.vars.palette.text.primary,
                    }}
                  >
                    Offline
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleModelSelect("gemma")}
                    selected={courseModel === "gemma"}
                    sx={{ pl: "32px" }}
                  >
                    <ListItemDecorator>
                      <ArrowRight />
                    </ListItemDecorator>
                    Gemma
                  </MenuItem>
                  <ListDivider />
                  <MenuItem
                    disabled
                    sx={{
                      fontWeight: "600",
                      color: theme.vars.palette.text.primary,
                    }}
                  >
                    Online
                  </MenuItem>
                  {Object.entries(MODEL_MAP)
                    .filter(([key]) => key !== "gemma")
                    .map(([key, value]) => (
                      <MenuItem
                        key={key}
                        onClick={() => handleModelSelect(parseInt(key))}
                        selected={MODEL_MAP[courseModel] === value}
                        sx={{ pl: "32px" }}
                      >
                        <ListItemDecorator>
                          <ArrowRight />
                        </ListItemDecorator>
                        {value}
                      </MenuItem>
                    ))}
                </Menu>
              </Stack>
            </motion.div>
            <CourseGenerateButton
              disabled={courseModel === "gemma" && !isOllama}
            />
          </Stack>
        </Stack>
      );
    }

    if (state.requestId) {
      return (
        <Stack spacing="24px" alignItems="stretch" p="24px">
          <CourseSuccessAlert state={state} />
          <Stack
            direction="row"
            spacing="16px"
            justifyContent="flex-start"
            alignItems="center"
          >
            <Button
              variant="outlined"
              color="neutral"
              onClick={onBack}
              sx={{ borderRadius: theme.radius.xs }}
              aria-label="Previous step"
            >
              Back
            </Button>
          </Stack>
        </Stack>
      );
    }
  } else {
    if (genaiState.isGenerating) {
      return <GenaiCourseProgress />;
    }

    if (isGenaiComplete) {
      return (
        <Stack spacing="24px" alignItems="stretch" p="24px">
          <CourseSuccessAlert state={genaiState} />
          <Stack
            direction="row"
            spacing="16px"
            justifyContent="flex-start"
            alignItems="center"
          >
            <Button
              variant="outlined"
              color="neutral"
              onClick={onBack}
              sx={{ borderRadius: theme.radius.xs }}
              aria-label="Previous step"
            >
              Back
            </Button>
          </Stack>
        </Stack>
      );
    }

    if (genaiState.error && !genaiState.isGenerating) {
      return (
        <Stack spacing="24px" alignItems="stretch" p="24px">
          <CourseFailureAlert state={genaiState} />
          <Stack
            direction="row"
            spacing="16px"
            justifyContent="space-between"
            alignItems="center"
          >
            <Button
              variant="outlined"
              color="neutral"
              onClick={onBack}
              sx={{ borderRadius: theme.radius.xs }}
              aria-label="Previous step"
            >
              Back
            </Button>
            <GenaiCourseGenerateButton />
          </Stack>
        </Stack>
      );
    }
  }

  return (
    <Stack spacing="24px" alignItems="stretch" p="24px">
      <Typography
        level="h3"
        sx={{ color: theme.vars.palette.text.primary, textAlign: "center" }}
      >
        Review Your Inputs
      </Typography>
      <Sheet
        variant="soft"
        sx={{
          borderRadius: theme.radius.xs,
          padding: "16px",
          backgroundColor: theme.vars.palette.background.level1,
        }}
      >
        <Stack spacing={1} gap={1} alignItems="stretch">
          {Object.entries(displayData).map(([key, value]) => (
            <Stack key={key} direction="row" justifyContent="space-between">
              <Typography
                level="body1"
                sx={{
                  fontWeight: "600",
                  color: theme.vars.palette.text.primary,
                }}
              >
                {key}:
              </Typography>
              <Typography
                level="body1"
                sx={{ color: theme.vars.palette.text.primary }}
              >
                {value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Sheet>
      <Stack
        direction="row"
        spacing="16px"
        justifyContent="space-between"
        alignItems="center"
      >
        <Button
          variant="outlined"
          color="neutral"
          onClick={onBack}
          sx={{ borderRadius: theme.radius.xs }}
          aria-label="Previous step"
        >
          Back
        </Button>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Stack
            direction="row"
            spacing="8px"
            alignItems="center"
            sx={{
              backgroundColor: theme.vars.palette.background.level1,
              borderRadius: theme.radius.xs,
              padding: "8px",
              boxShadow: theme.shadow.xs,
            }}
          >
            <Button
              variant="outlined"
              color="neutral"
              onClick={handleMenuOpen}
              sx={{
                borderRadius: theme.radius.xs,
                py: "4px",
                "&:hover": { backgroundColor: theme.vars.palette.neutral[100] },
              }}
              aria-label="Select model"
              aria-controls={anchorEl ? "model-selector-menu" : undefined}
              aria-haspopup="true"
            >
              {MODEL_MAP[courseModel] || "Select Model"}
            </Button>
            <Menu
              id="model-selector-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              sx={{
                borderRadius: theme.radius.xs,
                "--ListItemDecorator-size": "24px",
              }}
            >
              <MenuItem
                disabled
                sx={{
                  fontWeight: "600",
                  color: theme.vars.palette.text.primary,
                }}
              >
                Offline
              </MenuItem>
              <MenuItem
                onClick={() => handleModelSelect("gemma")}
                selected={courseModel === "gemma"}
                sx={{ pl: "32px" }}
              >
                <ListItemDecorator>
                  <ArrowRight />
                </ListItemDecorator>
                Gemma
              </MenuItem>
              <ListDivider />
              <MenuItem
                disabled
                sx={{
                  fontWeight: "600",
                  color: theme.vars.palette.text.primary,
                }}
              >
                Online
              </MenuItem>
              {Object.entries(MODEL_MAP)
                .filter(([key]) => key !== "gemma")
                .map(([key, value]) => (
                  <MenuItem
                    key={key}
                    onClick={() => handleModelSelect(parseInt(key))}
                    selected={MODEL_MAP[courseModel] === value}
                    sx={{ pl: "32px" }}
                  >
                    <ListItemDecorator>
                      <ArrowRight />
                    </ListItemDecorator>
                    {value}
                  </MenuItem>
                ))}
            </Menu>
          </Stack>
        </motion.div>
        {courseModel === "gemma" ? (
          <CourseGenerateButton
            disabled={courseModel === "gemma" && !isOllama}
          />
        ) : (
          <GenaiCourseGenerateButton />
        )}
      </Stack>

      {courseModel === "gemma" && (
        <Stack
          direction="row"
          spacing="16px"
          justifyContent="center"
          alignItems="center"
        >
          {loading && (
            <Stack direction="row" spacing="4px" alignItems="center">
              <CircularProgress
                size="sm"
                sx={{ color: theme.vars.palette.primary[500] }}
              />
              <Typography
                level="body2"
                sx={{ color: theme.vars.palette.text.secondary }}
              >
                Checking...
              </Typography>
            </Stack>
          )}
          {!loading && isOllama === true && (
            <Alert
              variant="soft"
              color="success"
              startDecorator={<CheckCircle />}
              sx={{
                borderRadius: theme.radius.xs,
                py: "4px",
                px: "8px",
                width: "30%",
                alignSelf: "center",
              }}
              aria-label="Ollama running alert"
            >
              <Typography level="body2">Ollama Running</Typography>
            </Alert>
          )}
          {!loading && isOllama === false && (
            <Tooltip
              title="Please run `ollama serve` in your terminal."
              placement="top"
              sx={{
                borderRadius: theme.radius.xs,
                backgroundColor: theme.vars.palette.neutral[800],
              }}
            >
              <Alert
                variant="soft"
                color="danger"
                startDecorator={<ErrorOutline />}
                sx={{
                  borderRadius: theme.radius.xs,
                  py: "4px",
                  px: "8px",
                  width: "30%",
                  alignSelf: "center",
                }}
                aria-label="Ollama not running alert"
              >
                <Typography level="body2">Ollama Not Running</Typography>
              </Alert>
            </Tooltip>
          )}
          <Button
            variant="outlined"
            color="neutral"
            onClick={checkOllamaStatus}
            disabled={loading}
            sx={{
              borderRadius: theme.radius.xs,
              py: "4px",
              "&:hover": {
                backgroundColor: theme.vars.palette.neutral[100],
              },
            }}
            aria-label="Refresh Ollama status"
          >
            Refresh
          </Button>
        </Stack>
      )}
    </Stack>
  );
};

export default ReviewStep;
