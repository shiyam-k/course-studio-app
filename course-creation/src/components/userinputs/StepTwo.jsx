import React from "react";
import { useRef } from "react";
import { Box, Stack } from "@mui/joy";
import { Button, Typography, Sheet } from "@mui/joy";
import { motion } from "framer-motion";
import { ImStarEmpty, ImStarHalf, ImStarFull } from "react-icons/im";
import theme from "../../styles/theme";
import useUserInput from "../../context/userinput/UserInputContext";

const StepTwo = ({ stepNumber, onNext, onBack }) => {
  const { formData, setFormData } = useUserInput();
  const containerRef = useRef(null);

  const options = [
    { label: "I’m new", value: 0, icon: <ImStarEmpty size={24} /> },
    {
      label: "I’ve tried it before",
      value: 1,
      icon: <ImStarHalf size={24} />,
    },
    {
      label: "I’m confident / advanced",
      value: 2,
      icon: <ImStarFull size={24} />,
    },
  ];

  const handleSelect = (option) => {
    console.log(option);
    setFormData((prev) => ({ ...prev, step2: option.value }));
  };

  return (
    <Box p="24px" ref={containerRef}>
      <Stack spacing="24px" alignItems="stretch">
        <Typography
          level="h3"
          sx={{ color: theme.vars.palette.text.primary, textAlign: "center" }}
        >
          How much do you already know?
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
              aria-checked={formData?.step2 === option.value}
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
                  formData?.step2 === option.value ? "solid" : "outlined"
                }
                sx={{
                  borderRadius: theme.radius.xs,
                  padding: "16px",
                  minWidth: "200px",
                  width: "auto",
                  textAlign: "center",
                  borderColor: theme.vars.palette.neutral[400],
                  backgroundColor:
                    formData?.step2 === option.value
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
                        formData?.step2 === option.value ? "600" : "400",
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
            disabled={![0, 1, 2].includes(formData?.step2)}
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

export default StepTwo;
