import React from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Stack, Typography, Button } from "@mui/joy";
import { CheckCircle } from "@mui/icons-material";
import theme from "../../styles/theme";

const CourseSuccessAlert = ({ state }) => {
  const navigate = useNavigate();

  const handleGoToCourse = () => {
    console.log(`Navigating to course with Request ID: ${state.requestId}`);
    navigate("/course-dashboard");
  };

  return (
    <Alert
      variant="outlined"
      sx={{
        borderRadius: theme.radius.xs,
        padding: "16px",
        border: `.1px solid ${theme.vars.palette.success[400]}`,
      }}
      aria-label="Course generation success alert"
    >
      <Stack
        spacing="8px"
        width={"100%"}
        alignItems={"center"}
        justifyContent={"center"}
      >
        <Typography level="h4" sx={{ color: theme.vars.palette.text.primary }}>
          Course Generated Successfully
        </Typography>
        <Button
          variant="solid"
          color="success"
          onClick={handleGoToCourse}
          sx={{
            borderRadius: theme.radius.xs,
            backgroundColor: theme.vars.palette.success[500],
            "&:hover": {
              backgroundColor: theme.vars.palette.success[600],
            },
            mt: "8px",
          }}
          aria-label="Go to generated course"
          startDecorator={<CheckCircle />}
        >
          Go to Course
        </Button>
      </Stack>
    </Alert>
  );
};

export default CourseSuccessAlert;