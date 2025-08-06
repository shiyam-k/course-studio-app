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
import useGenaiStatus from "../../context/genaicourse/GenaiContext";
import { CheckCircle, HourglassEmpty, ErrorOutline } from "@mui/icons-material";
import PendingIcon from "@mui/icons-material/Pending";
import ShinyText from "../styledcomponents/ShinyText";
import useInputContext from "../../context/userinput/UserInputContext";
import TimelapseIcon from "@mui/icons-material/Timelapse";

export const GenaiCourseGenerateButton = () => {
  const { genaiState, genaiDispatch, startGenaiGeneration } = useGenaiStatus();
  const { formData, courseModel } = useInputContext();

  const handleOpenModal = () => {
    genaiDispatch({ type: "OPEN_MODAL" });
  };

  const handleCloseModal = () => {
    genaiDispatch({ type: "CLOSE_MODAL" });
  };

  const handleConfirm = () => {
    const mappedData = {
      topic: formData.learningGoal,
      experience: formData.step2,
      total_weeks: parseInt(formData.step3Weeks, 10),
      hours_per_week: parseInt(formData.step3, 10),
      learning_style: formData.step4,
      motivation: formData.step5,
      custom_motivation: formData.step5Other || "",
      model_id: courseModel || 0,
    };
    console.log("Starting GenAI course generation with data:", mappedData);
    startGenaiGeneration(mappedData);
  };

  return (
    <>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="solid"
          color="success"
          onClick={handleOpenModal}
          disabled={genaiState.isGenerating}
          aria-label="Generate new GenAI course"
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
          {genaiState.isGenerating ? "Generating..." : "Create AI Course"}
        </Button>
      </motion.div>
      <Modal open={genaiState.isModalOpen} onClose={handleCloseModal}>
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
            Confirm GenAI Course Creation
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

export const GenaiCourseProgress = () => {
  const { genaiState } = useGenaiStatus();
  const [runningTimes, setRunningTimes] = useState({});

  useEffect(() => {
    console.log("GenaiCourseProgress: genaiState updated:", genaiState);
    console.log("GenaiCourseProgress: Current progress:", genaiState.progress);
    const interval = setInterval(() => {
      const newRunningTimes = {};
      Object.entries(genaiState.progressMap).forEach(([step, data]) => {
        console.log("GenaiCourseProgress: Processing step:", step, data);
        if (data.status === 1 && data.timestamp) {
          const startTime = new Date(data.timestamp).getTime();
          const currentTime = Date.now();
          const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
          const minutes = Math.floor(elapsedSeconds / 60);
          const seconds = elapsedSeconds % 60;
          newRunningTimes[step] = `${minutes}m ${seconds}s`;
        }
      });
      setRunningTimes((prev) => {
        console.log(
          "GenaiCourseProgress: Updating runningTimes:",
          newRunningTimes
        );
        return newRunningTimes;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [genaiState.progressMap]);

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

  console.log(genaiState.progressMap);

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
      aria-label="GenAI Course Generation Progress"
    >
      <Stack spacing="16px" direction="column">
        {genaiState.requestId && (
          <Alert
            variant="soft"
            color="success"
            startDecorator={<CheckCircle />}
          >
            GenAI course generated successfully! Request ID:{" "}
            {genaiState.requestId}
          </Alert>
        )}
        {!genaiState.requestId && genaiState.error && (
          <Alert
            variant="soft"
            color="danger"
            startDecorator={<ErrorOutline />}
          >
            Error: {genaiState.error}
          </Alert>
        )}
        {genaiState.isGenerating && (
          <Box>
            <Typography level="body1" sx={{ marginBottom: "8px" }}>
              Progress: {Math.round(genaiState.progress)}%
            </Typography>
            <LinearProgress
              determinate
              value={Math.round(genaiState.progress)}
              sx={{
                "--LinearProgress-thickness": "8px",
                borderRadius: theme.radius.xs,
                backgroundColor: theme.vars.palette.neutral[200],
                "& .MuiLinearProgress-bar": {
                  backgroundColor: theme.vars.palette.success[500],
                },
              }}
              aria-label={`GenAI course generation progress: ${Math.round(
                genaiState.progress
              )}%`}
            />
          </Box>
        )}
        <List
          sx={{
            overflowY: "auto",
            borderRadius: theme.radius.xs,
            backgroundColor: "var(--joy-palette-background-level1)",
            padding: "8px",
          }}
          aria-label="GenAI course generation progress log"
        >
          {Object.entries(genaiState.progressMap).map(([step, data]) => {
            console.log("GenaiCourseProgress: Rendering step:", step, data);
            const { icon, color } = getStatusProps(data.status);
            return (
              <ListItem
                key={step}
                sx={{
                  padding: "2%",
                  borderBottom: "1px solid var(--joy-palette-divider)",
                }}
              >
                <Stack direction="row" spacing='8px' alignItems="center" width={"100%"}>
                  <Box>{icon}</Box>
                  <Box>
                    <Stack
                      direction="row"
                      justifyContent="center"
                      gap={30}
                      alignItems="center"
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
                          sx={{ color, fontWeight: "600" }}
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
                    {data.error !== null && (
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
