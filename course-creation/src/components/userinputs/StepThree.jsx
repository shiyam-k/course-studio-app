import React from "react";
import { useState, useCallback, useMemo } from "react";
import { Box, Stack } from "@mui/joy";
import { Button, Typography, Sheet, Slider } from "@mui/joy";
import { motion, AnimatePresence } from "framer-motion";
import theme from "../../styles/theme";
import useUserInput from "../../context/userinput/UserInputContext";

const StepThree = ({ stepNumber, onNext, onBack }) => {
  const { formData, setFormData } = useUserInput();
  const [hours, setHours] = useState(formData?.step3 || 4);

  const weekOptions = useMemo(
    () => [
      { label: "4 weeks", value: 4 },
      { label: "6 weeks", value: 6 },
      { label: "8 weeks", value: 8 },
    ],
    []
  );

  const getRangeLabel = useCallback((value) => {
    if (value <= 10) return "Low";
    if (value <= 16) return "Medium";
    return "High";
  }, []);

  const getRangeColor = useCallback((value) => {
    if (value <= 10) return theme.vars.palette.neutral[400];
    if (value <= 16) return theme.vars.palette.primary[500];
    return theme.vars.palette.success[500];
  }, []);

  const handleSliderChange = useCallback(
    (event, newValue) => {
      setHours(newValue);
      setFormData((prev) => ({ ...prev, step3: newValue }));
    },
    [setFormData]
  );

  const handleWeekSelect = useCallback(
    (value) => {
      setFormData((prev) => ({ ...prev, step3Weeks: value }));
    },
    [setFormData]
  );

  return (
    <Box p="24px">
      <Stack spacing="24px" alignItems="stretch">
        <Typography level="h3" sx={{ color: theme.vars.palette.text.primary, textAlign: "center" }}>
          How many hours can you study each week?
        </Typography>
        <Sheet
          variant="outlined"
          sx={{
            borderRadius: theme.radius.xs,
            padding: "16px",
            backgroundColor: theme.vars.palette.background.surface,
            boxShadow: theme.vars.shadow.sm,
          }}
        >
          <Stack spacing="16px" alignItems="stretch">
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Slider
                value={hours}
                onChange={handleSliderChange}
                min={4}
                max={24}
                step={1}
                aria-label="Study hours per week"
                aria-valuetext={`${hours} hours (${getRangeLabel(hours)})`}
                sx={{
                  "--Slider-trackBackground": theme.vars.palette.primary[500],
                  "--Slider-thumbBackground": theme.vars.palette.primary[900],
                  "&:hover": {
                    "--Slider-thumbBackground": theme.vars.palette.primary[100],
                  },
                }}
              />
            </motion.div>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: "8px",
              }}
            >
              <Typography level="body2" sx={{ color: theme.vars.palette.text.secondary }}>
                4h
              </Typography>
              <Typography level="body2" sx={{ color: theme.vars.palette.text.secondary }}>
                24h
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} gap={2} justifyContent="center" flexWrap="wrap">
              {weekOptions.map((option) => (
                <motion.div
                  key={option.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleWeekSelect(option.value)}
                  role="radio"
                  tabIndex={0}
                  aria-checked={formData?.step3Weeks === option.value}
                  aria-label={option.label}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleWeekSelect(option.value);
                    }
                  }}
                >
                  <Sheet
                    variant={formData?.step3Weeks === option.value ? "solid" : "outlined"}
                    sx={{
                      borderRadius: theme.radius.xs,
                      padding: "8px 16px",
                      minWidth: "80px",
                      textAlign: "center",
                      borderColor: theme.vars.palette.neutral[400],
                      backgroundColor:
                        formData?.step3Weeks === option.value
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
                    <Typography
                      level="body1"
                      sx={{
                        color: theme.vars.palette.text.primary,
                        fontWeight: formData?.step3Weeks === option.value ? "600" : "400",
                      }}
                    >
                      {option.label}
                    </Typography>
                  </Sheet>
                </motion.div>
              ))}
            </Stack>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${hours}-${getRangeLabel(hours)}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Typography
                  level="body1"
                  sx={{
                    textAlign: "center",
                    color: getRangeColor(hours),
                    fontWeight: "600",
                  }}
                >
                  {hours} hours ({getRangeLabel(hours)})
                </Typography>
              </motion.div>
            </AnimatePresence>
          </Stack>
        </Sheet>
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
            disabled={!formData?.step3 || !formData?.step3Weeks}
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

export default StepThree;