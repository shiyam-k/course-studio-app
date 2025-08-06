import React from "react";
import { useRef, useCallback, useMemo } from "react";
import { Box, Stack } from "@mui/joy";
import { Button, Typography, Sheet } from "@mui/joy";
import { motion } from "framer-motion";
import BoltIcon from "@mui/icons-material/Bolt";
import HubIcon from "@mui/icons-material/Hub";
import ConstructionIcon from "@mui/icons-material/Construction";
import theme from "../../styles/theme";
import useUserInput from "../../context/userinput/UserInputContext";

const StepFour = ({ stepNumber, onNext, onBack }) => {
  const { formData, setFormData } = useUserInput();
  const containerRef = useRef(null);

  const options = useMemo(
    () => [
      { label: "Quick Course", value: 0, icon: <BoltIcon size={24} /> },
      { label: "Skill Path", value: 1, icon: <HubIcon size={24} /> },
      {
        label: "Build-a-Project",
        value: 2,
        icon: <ConstructionIcon size={24} />,
      },
    ],
    []
  );

  const handleSelect = useCallback(
    (option) => {
      setFormData((prev) => ({ ...prev, step4: option.value }));
    },
    [setFormData]
  );

  return (
    <Box p="24px" ref={containerRef}>
      <Stack spacing="24px" alignItems="stretch">
        <Typography
          level="h3"
          sx={{ color: theme.vars.palette.text.primary, textAlign: "center" }}
        >
          Pick your learning style
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          gap={2}
          justifyContent="center"
          flexWrap="wrap"
        >
          {options.map((option) => (
            <motion.div
              key={option.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(option)}
              role="radio"
              tabIndex={0}
              aria-checked={formData?.step4 === option.value}
              aria-label={option.label}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSelect(option.value);
                }
              }}
            >
              <Sheet
                className="cursor-target"
                variant={
                  formData?.step4 === option.value ? "solid" : "outlined"
                }
                sx={{
                  borderRadius: theme.radius.xs,
                  padding: "16px",
                  width: "180px",
                  textAlign: "center",
                  borderColor: theme.vars.palette.neutral[400],
                  backgroundColor:
                    formData?.step4 === option.value
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
                      fontWeight:
                        formData?.step4 === option.value ? "600" : "400",
                    }}
                  >
                    {option.label}
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
            disabled={![0, 1, 2].includes(formData?.step4)}
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

export default StepFour;
