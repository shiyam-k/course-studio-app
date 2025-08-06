import React from "react";
import { useState, useMemo } from "react";
import { Box, Stack, Stepper, Step, Button, Sheet, Typography } from "@mui/joy";
import { motion, AnimatePresence } from "framer-motion";
import { AiOutlineRise } from "react-icons/ai";
import SchoolIcon from '@mui/icons-material/School';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ExtensionIcon from '@mui/icons-material/Extension';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import GradingIcon from '@mui/icons-material/Grading';
import theme from "../../styles/theme";
import useUserInput from "../../context/userinput/UserInputContext";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import StepFour from "./StepFour";
import StepFive from "./StepFive";
import ReviewStep from "./ReviewStep";
import StepSix from "./StepSix";

const PlaceholderStep = ({ stepNumber, onNext, onBack }) => {
  const { setFormData } = useUserInput();

  const handleSkip = () => {
    setFormData((prev) => ({
      ...prev,
      [`step${stepNumber}`]: "Skipped",
    }));
    onNext(stepNumber); // Pass the next step index
  };

  return (
    <Box p="24px">
      <Typography level="h3" sx={{ color: theme.vars.palette.text.primary }}>
        Step {stepNumber}/7 - Placeholder
      </Typography>
      <Typography level="body1" sx={{ mt: "8px" }}>
        This step will be implemented for question {stepNumber}.
      </Typography>
      <Stack direction="row" spacing="16px" justifyContent="space-between" mt="24px">
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
          onClick={handleSkip}
          sx={{
            borderRadius: theme.radius.xs,
            backgroundColor: theme.vars.palette.primary[500],
            "&:hover": {
              backgroundColor: theme.vars.palette.primary[600],
            },
          }}
          aria-label="Skip step"
        >
          Skip
        </Button>
      </Stack>
    </Box>
  );
};

const StepperComponent = () => {
  const [isNext, setIsNext] = useState(true);
  const { formData, activeStep, changeActiveStep } = useUserInput();

  const steps = [
    { label: "Learning Goal", icon: <SchoolIcon fontSize="small" /> },
    { label: "Prior Knowledge", icon: <SchoolIcon fontSize="small" /> },
    { label: "Study Hours", icon: <CalendarMonthIcon fontSize="small" /> },
    { label: "Learning Style", icon: <ExtensionIcon fontSize="small" /> },
    { label: "Motivation", icon: <AiOutlineRise size={20} /> },
    { label: "Structure", icon: <AccountTreeIcon fontSize="small" /> },
    { label: "Review", icon: <GradingIcon fontSize="small" /> },
  ];

  const handleNext = () => {
    setIsNext(true);
    changeActiveStep(activeStep + 1); // Use context to update step
  };

  const handleBack = () => {
    setIsNext(false);
    changeActiveStep(activeStep - 1); // Use context to update step
  };

  const handleStepClick = (index) => {
    setIsNext(index > activeStep);
    changeActiveStep(index); // Use context to update step
  };

  const handleSubmit = () => {
    console.log("Form submitted:", formData);
  };

  const stepComponents = useMemo(
    () => [
      <StepOne key="step1" stepNumber={1} onNext={handleNext} onBack={handleBack} />,
      <StepTwo key="step2" stepNumber={2} onNext={handleNext} onBack={handleBack} />,
      <StepThree key="step3" stepNumber={3} onNext={handleNext} onBack={handleBack} />,
      <StepFour key="step4" stepNumber={4} onNext={handleNext} onBack={handleBack} />,
      <StepFive key="step5" stepNumber={5} onNext={handleNext} onBack={handleBack} />,
      <StepSix key="step6" stepNumber={6} onNext={handleNext} onBack={handleBack} />,
      <ReviewStep key="step7" stepNumber={7} onSubmit={handleSubmit} onBack={handleBack} />,
    ],
    [handleStepClick, handleNext, handleBack, handleSubmit]
  );

  const transitionVariants = {
    initial: (isNext) => ({
      opacity: 0,
      x: isNext ? 50 : -50,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (isNext) => ({
      opacity: 0,
      x: isNext ? -50 : 50,
    }),
  };

  return (
    <Box
      sx={{
        maxWidth: "75%",
        margin: "0 auto",
        padding: "32px",
        backgroundColor: theme.vars.palette.background.body,
      }}
    >
      <Stepper
        activeStep={activeStep}
        sx={{
          marginBottom: "32px",
          "--Step-connectorThickness": "3px",
          "--StepIndicator-size": "36px",
        }}
      >
        {steps.map((step, index) => {
          const isSkipped = formData && formData[`step${index + 1}`] === "Skipped";
          return (
            <Step
              indicator={step.icon}
              key={step.label}
              sx={{
                "& .MuiStepIndicator-root": {
                  backgroundColor:
                    activeStep >= index
                      ? isSkipped
                        ? theme.vars.palette.warning[500]
                        : theme.vars.palette.primary[500]
                      : isSkipped
                        ? theme.vars.palette.warning[200]
                        : theme.vars.palette.neutral[400],
                  color: theme.vars.palette.background.surface,
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "600",
                },
              }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ cursor: "pointer" }}
                onClick={() => handleStepClick(index)}
                role="button"
                tabIndex={0}
                aria-label={`Go to ${step.label} step`}
              >
                <Typography
                  level="body2"
                  sx={{
                    color:
                      activeStep >= index
                        ? isSkipped
                          ? theme.vars.palette.warning[500]
                          : theme.vars.palette.primary[500]
                        : isSkipped
                          ? theme.vars.palette.warning[200]
                          : theme.vars.palette.neutral[400],
                    fontWeight: activeStep >= index ? "600" : "400",
                    mt: "8px",
                  }}
                >
                  {step.label}
                </Typography>
              </motion.div>
            </Step>
          );
        })}
      </Stepper>
      <Sheet
        variant="outlined"
        sx={{
          borderRadius: theme.radius.xs,
          padding: "24px",
          boxShadow: theme.vars.shadow.md,
          backgroundColor: theme.vars.palette.background.surface,
          width: { xs: "90%", sm: "80%", md: "70%" },
          margin: "auto",
        }}
      >
        <AnimatePresence mode="wait" custom={isNext}>
          <motion.div
            key={activeStep}
            custom={isNext}
            variants={transitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {stepComponents[activeStep]}
          </motion.div>
        </AnimatePresence>
      </Sheet>
    </Box>
  );
};

export default StepperComponent;