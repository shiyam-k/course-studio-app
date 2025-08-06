import React, { useState, useEffect } from "react";
import {
  Box,
  Modal,
  ModalDialog,
  Button,
  Typography,
  Stack,
  LinearProgress,
  List,
  ListItem,
  Alert,
} from "@mui/joy";
import { motion } from "framer-motion";
import theme from "../../styles/theme";
import useCourseStatus from "../../context/coursestatus/CourseStatusContext";
import {
  CheckCircle,
  HourglassEmpty,
  PlayArrow,
  ErrorOutline,
} from "@mui/icons-material";
import PendingIcon from "@mui/icons-material/Pending";
import ShinyText from "../styledcomponents/ShinyText";
import GradientText from "../styledcomponents/GradientText";
import useInputContext from "../../context/userinput/UserInputContext";
import TimelapseIcon from "@mui/icons-material/Timelapse";

export const CourseGenerateButton = ({ disabled }) => {
  const { state, dispatch, startGeneration } = useCourseStatus();
  const { formData } = useInputContext();

  const handleOpenModal = () => {
    dispatch({ type: "OPEN_MODAL" });
  };

  const handleCloseModal = () => {
    dispatch({ type: "CLOSE_MODAL" });
  };

  const handleConfirm = () => {
    const mapKeys = () => {
      if (
        !formData ||
        !formData.learningGoal ||
        !formData.step2 ||
        !formData.step3Weeks ||
        !formData.step3 ||
        !formData.step4 ||
        !formData.step5
      )
        return {
          topic: formData.learningGoal,
          experience: formData.step2,
          total_weeks: parseInt(formData.step3Weeks, 10),
          hours_per_week: parseInt(formData.step3, 10),
          learning_style: formData.step4,
          motivation: formData.step5,
          custom_motivation: formData.step5Other || "",
        };
    };
    startGeneration(mapKeys(formData));
  };

  console.log(state);

  return (
    <>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="solid"
          color="success"
          onClick={handleOpenModal}
          disabled={state.isGenerating || disabled}
          aria-label="Generate new course"
          sx={{
            borderRadius: theme.radius.xs,
            fontWeight: "bold",
            padding: "8px 16px",
            backgroundColor: theme.vars.palette.success[500],
            "&:hover": {
              backgroundColor: theme.vars.palette.success[600],
            },
          }}
        >
          {state.isGenerating ? "Generating..." : "Create Course"}
        </Button>
      </motion.div>
      <Modal open={state.isModalOpen} onClose={handleCloseModal}>
        <ModalDialog
          sx={{
            borderRadius: theme.radius.sm,
            padding: "24px",
            maxWidth: "400px",
            backgroundColor: theme.vars.palette.background.body,
          }}
          aria-labelledby="confirm-modal-title"
        >
          <Typography id="confirm-modal-title" level="h4" sx={{ mb: "16px" }}>
            Confirm Course Creation
          </Typography>
          <Typography level="body1" sx={{ mb: "24px" }}>
            Are you sure you want to create this course? This will start the
            generation process.
          </Typography>
          <Stack direction="row" spacing="16px" justifyContent="flex-end">
            <Button
              variant="outlined"
              color="neutral"
              onClick={handleCloseModal}
              sx={{ borderRadius: theme.radius.xs }}
              aria-label="Cancel course creation"
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="success"
              onClick={handleConfirm}
              sx={{
                borderRadius: theme.radius.xs,
                backgroundColor: theme.vars.palette.success[500],
                "&:hover": {
                  backgroundColor: theme.vars.palette.success[600],
                },
              }}
              aria-label="Confirm course creation"
            >
              Create
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </>
  );
};

export const CourseProgress = () => {
  const { state } = useCourseStatus();
  const isMobile = false; // Assuming non-mobile for styling consistency
  const [runningTimes, setRunningTimes] = useState({});

  // Calculate running time for "In Progress" steps
  useEffect(() => {
    const interval = setInterval(() => {
      const newRunningTimes = {};
      Object.entries(state.progressMap).forEach(([step, data]) => {
        if (data.status === 1 && data.timestamp) {
          const startTime = new Date(data.timestamp).getTime();
          const currentTime = Date.now();
          const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
          const minutes = Math.floor(elapsedSeconds / 60);
          const seconds = elapsedSeconds % 60;
          newRunningTimes[step] = `${minutes}m ${seconds}s`;
        }
      });
      setRunningTimes(newRunningTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.progressMap]);

  const getStatusProps = (status) => {
    switch (status) {
      case 0:
        return {
          icon: <HourglassEmpty color="secondary" />,
          color: theme.vars.palette.neutral[400],
        };
      case 1:
        return {
          icon: <PendingIcon color="primary" />,
          color: theme.vars.palette.primary[500],
        };
      case 2:
        return {
          icon: <CheckCircle color="success" />,
          color: theme.vars.palette.success[700],
        };
      default:
        return {
          icon: <ErrorOutline color="error" />,
          color: theme.vars.palette.danger[500],
        };
    }
  };

  return (
    <Box
      sx={{
        padding: "16px",
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "var(--joy-palette-background-body)",
        borderRadius: theme.radius.sm,
        boxShadow: theme.shadow.sm,
      }}
      role="region"
      aria-label="Course Generation Progress"
    >
      <Stack spacing="16px" direction="column">
        {state.error && (
          <Alert
            variant="soft"
            color="danger"
            startDecorator={<ErrorOutline />}
          >
            Error: {state.error}
          </Alert>
        )}
        {state.isGenerating && (
          <Box>
            <Typography level="body1" sx={{ marginBottom: "8px" }}>
              Progress: {Math.round(state.progress)}%
            </Typography>
            <LinearProgress
              determinate
              value={state.progress}
              sx={{
                "--LinearProgress-thickness": "8px",
                borderRadius: theme.radius.xs,
                backgroundColor: theme.vars.palette.neutral[200],
                "& .MuiLinearProgress-bar": {
                  backgroundColor: theme.vars.palette.success[500],
                },
              }}
              aria-label={`Course generation progress: ${Math.round(
                state.progress
              )}%`}
            />
          </Box>
        )}
        {state.requestId && (
          <Alert
            variant="soft"
            color="success"
            startDecorator={<CheckCircle />}
          >
            Course generated successfully! Request ID: {state.requestId}
          </Alert>
        )}
        <List
          sx={{
            // maxHeight: "300px",
            overflowY: "auto",
            borderRadius: theme.radius.xs,
            backgroundColor: "var(--joy-palette-background-level1)",
            padding: "8px",
          }}
          aria-label="Course generation progress log"
        >
          {Object.entries(state.progressMap).map(([step, data]) => {
            const { icon, color } = getStatusProps(data.status);
            return (
              <ListItem
                key={step}
                sx={{
                  padding: "2%",
                  borderBottom: "1px solid var(--joy-palette-divider)",
                }}
              >
                <Stack direction="row" spacing="8px" alignItems="center">
                  <Box>{icon}</Box>
                  <Box>
                    <Stack
                      flexDirection={"row"}
                      justifyContent={"center"}
                      gap={30}
                      alignItems={"center"}
                    >
                      {data.status === 1 ? (
                        <ShinyText
                          text={step.replace(/_/g, " ").toUpperCase()}
                          speed={5}
                          className="custom-class"
                        />
                      ) : (
                        <Typography
                          level="title-md"
                          sx={{ color: color, fontWeight: "600" }}
                        >
                          {step.replace(/_/g, " ").toUpperCase()}
                        </Typography>
                      )}
                      {data.status === 1 && runningTimes[step] && (
                        <Typography
                          level="body3"
                          sx={{
                            color: theme.vars.palette.text.secondary,
                            width: "100px",
                          }}
                          startDecorator={<TimelapseIcon />}
                        >
                          {runningTimes[step]}
                        </Typography>
                      )}
                    </Stack>
                    {data.error && (
                      <Typography
                        level="body3"
                        sx={{ color: theme.vars.palette.danger[500] }}
                      >
                        Error: {data.error}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </ListItem>
            );
          })}
        </List>
      </Stack>
    </Box>
  );
};
