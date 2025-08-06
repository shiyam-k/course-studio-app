import React from "react";
import { useRef, useCallback, useMemo } from "react";
import { Box, Stack } from "@mui/joy";
import { Button, Typography, Sheet } from "@mui/joy";
import { motion } from "framer-motion";
import SchemaIcon from '@mui/icons-material/Schema';
import TimelineIcon from '@mui/icons-material/Timeline';
import Grid4x4Icon from '@mui/icons-material/Grid4x4';
import theme from "../../styles/theme";
import useUserInput from "../../context/userinput/UserInputContext";

const StepSix = ({ stepNumber, onNext, onBack }) => {
  const { formData, setFormData } = useUserInput();
  const containerRef = useRef(null);

  const options = useMemo(
    () => [
      {
        label: "Flexible",
        value: 0,
        icon: <SchemaIcon fontSize="medium" />,
        description: "Only Final Quiz for completion",
      },
      {
        label: "Guided",
        value: 1,
        icon: <TimelineIcon fontSize="medium" />,
        description: "Weekly Quiz, Final Quiz, Final Milestone",
      },
      {
        label: "Strict",
        value: 2,
        icon: <Grid4x4Icon fontSize="medium" />,
        description: "Weekly Quiz, Weekly Milestone, Final Quiz, Final Milestone, Weekly Review",
      },
    ],
    []
  );

  const handleSelect = useCallback(
    (option) => {
      setFormData((prev) => ({ ...prev, step6: option.value }));
    },
    [setFormData]
  );

  return (
    <Box p="24px" ref={containerRef}>
      <Stack spacing="24px" alignItems="stretch">
        <Typography level="h3" sx={{ color: theme.vars.palette.text.primary, textAlign: "center" }}>
          How much structure do you want?
        </Typography>
        <Stack direction="row" spacing={1} gap={2} justifyContent="center" flexWrap="wrap">
          {options.map((option) => (
            <motion.div
              key={option.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(option)}
              role="radio"
              tabIndex={0}
              aria-checked={formData?.step6 === option.value}
              aria-label={option.label}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSelect(option.value);
                }
              }}
            >
              <Sheet
                className="cursor-target"
                variant={formData?.step6 === option.value ? "solid" : "outlined"}
                sx={{
                  borderRadius: theme.radius.xs,
                  padding: "16px",
                  width: "250px",
                  textAlign: "center",
                  borderColor: theme.vars.palette.neutral[400],
                  backgroundColor:
                    formData?.step6 === option.value
                      ? theme.vars.palette.primary[500]
                      : theme.vars.palette.background.surface,
                  boxShadow: theme.vars.shadow.sm,
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: theme.vars.palette.primary[300],
                    boxShadow: theme.vars.shadow.md,
                  },
                }}
              >
                <Stack spacing="8px">
                  {option.icon}
                  <Typography
                    level="body1"
                    sx={{
                      color: theme.vars.palette.text.primary,
                      fontWeight: formData?.step6 === option.value ? "600" : "400",
                    }}
                  >
                    {option.label}
                  </Typography>
                  <Typography
                    level="body2"
                    sx={{
                      color: theme.vars.palette.text.secondary,
                      fontSize: "0.75rem",
                    }}
                  >
                    {option.description}
                  </Typography>
                </Stack>
              </Sheet>
            </motion.div>
          ))}
        </Stack>
        <Stack direction="row" justifyContent="space-between" mt="24px">
          <Button
            variant="outlined"
            color="neutral"
            onClick={onBack}
            sx={{ borderRadius: theme.radius.xs }}
            aria-label="Previous step"
          >
            Back
          </Button>
          <Button
            variant="solid"
            color="primary"
            onClick={onNext}
            disabled={![0, 1, 2].includes(formData?.step6)}
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
    </Box>
  );
};

export default StepSix;