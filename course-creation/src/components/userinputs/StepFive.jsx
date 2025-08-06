import React, { useRef, useCallback, useMemo } from "react";
import { Box, Stack, Typography, Sheet, Input, Button } from "@mui/joy";
import { motion } from "framer-motion";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import EditIcon from "@mui/icons-material/Edit";
import theme from "../../styles/theme";
import useUserInput from "../../context/userinput/UserInputContext";

const StepFive = ({ stepNumber, onNext, onBack }) => {
  const { formData, setFormData } = useUserInput();
  const containerRef = useRef(null);

  const options = useMemo(
    () => [
      { label: "Career", value: 0, icon: <WorkIcon fontSize="medium" /> },
      { label: "Academic", value: 1, icon: <SchoolIcon fontSize="medium" /> },
      { label: "Fun", value: 2, icon: <InsertEmoticonIcon fontSize="medium" /> },
      { label: "Other", value: 3, icon: <EditIcon fontSize="medium" /> },
    ],
    []
  );

  const handleSelect = useCallback(
    (value) => {
      setFormData((prev) => ({
        ...prev,
        step5: value,
        step5Other: value === 3 ? prev.step5Other || "" : "",
      }));
    },
    [setFormData]
  );

  const handleOtherInput = useCallback(
    (event) => {
      const value = event.target.value;
      setFormData((prev) => ({
        ...prev,
        step5: 3,
        step5Other: value,
      }));
    },
    [setFormData]
  );

  const isSelected = useCallback(
    (value) => formData?.step5 === value,
    [formData]
  );

  return (
    <Box p="24px" ref={containerRef}>
      <Stack spacing="24px" alignItems="stretch">
        <Typography
          level="h3"
          sx={{
            color: theme.vars.palette.text.primary,
            textAlign: "center",
          }}
        >
          Why are you taking this?
        </Typography>

        <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" gap={2}>
          {options.map((option) => (
            <motion.div
              key={option.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(option.value)}
              role="radio"
              tabIndex={0}
              aria-checked={isSelected(option.value)}
              aria-label={option.label}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSelect(option.value);
                }
              }}
            >
              <Sheet
                className="cursor-target"
                variant={isSelected(option.value) ? "solid" : "outlined"}
                sx={{
                  borderRadius: theme.radius.xs,
                  padding: "16px",
                  width: "180px",
                  textAlign: "center",
                  borderColor: theme.vars.palette.neutral[400],
                  backgroundColor: isSelected(option.value)
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
                <Stack spacing="8px" alignItems="center">
                  {option.icon}
                  <Typography
                    level="body1"
                    sx={{
                      color: theme.vars.palette.text.primary,
                      fontWeight: isSelected(option.value) ? "600" : "400",
                    }}
                  >
                    {option.label}
                  </Typography>
                </Stack>
              </Sheet>
            </motion.div>
          ))}
        </Stack>

        {formData?.step5 === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Input
              autoFocus
              placeholder="Specify other reason"
              value={formData?.step5Other || ""}
              onChange={handleOtherInput}
              aria-label="Other reason for taking the course"
              sx={{
                maxWidth: "400px",
                mx: "auto",
                borderRadius: theme.radius.xs,
                "& .MuiInputBase-root": {
                  backgroundColor: theme.vars.palette.background.surface,
                },
              }}
            />
          </motion.div>
        )}

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
            disabled={
              formData?.step5 === undefined ||
              (formData?.step5 === 3 && !formData?.step5Other?.trim())
            }
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

export default StepFive;
