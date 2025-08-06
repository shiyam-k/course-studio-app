import React from "react";
import { Stack, Box } from "@mui/joy";
import { Button, Typography } from "@mui/joy";
import theme from "../../styles/theme";
import useInputContext from "../../context/userinput/UserInputContext";

const StepOne = ({ onNext }) => {
  const { formData, setFormData } = useInputContext();

  const handleInputChange = (e) => {
    setFormData({ ...formData, learningGoal: e.target.value });
  };

  return (
    <Stack spacing="16px" alignItems="stretch" p="16px">
      <Typography level="h3" sx={{ color: theme.vars.palette.text.primary, textAlign: "center" }}>
        What do you want to learn?
      </Typography>
      <input
        type="text"
        value={formData?.learningGoal || ""}
        onChange={handleInputChange}
        placeholder="Enter your learning goal"
        style={{
          padding: "8px",
          borderRadius: theme.radius.xs,
          border: `1px solid ${theme.vars.palette.neutral[400]}`,
          fontSize: "1rem",
          color: theme.vars.palette.text.primary,
          backgroundColor: theme.vars.palette.background.surface,
          transition: "all 0.2s",
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = `0 0 0 3px ${theme.vars.palette.primary[100]}`;
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = "none";
        }}
        aria-label="Learning goal input"
      />
      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="solid"
          color="primary"
          onClick={onNext}
          disabled={!formData?.learningGoal}
          sx={{
            borderRadius: theme.radius.xs,
            backgroundColor: theme.vars.palette.primary[500],
            "&:hover": {
              backgroundColor: theme.vars.palette.primary[600],
            },
          }}
          aria-label="Next step"
        >
          Next
        </Button>
      </Stack>
    </Stack>
  );
};

export default StepOne;