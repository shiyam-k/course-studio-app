import { useState, useMemo } from "react";
import { Box, VStack, useBreakpointValue } from "@chakra-ui/react";
import { Tabs, TabList, Tab, TabPanel, Sheet, Typography } from "@mui/joy";
import { motion } from "framer-motion";
import theme from "../../styles/theme";
import AuthForm from "./Authform";

const AuthPage = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const maxWidth = useBreakpointValue({ base: "100%", md: "500px" });
  const padding = useBreakpointValue({ base: "16px", md: "24px" });

  const tabs = useMemo(
    () => [
      { label: "Login", component: <AuthForm mode="login" /> },
      { label: "Signup", component: <AuthForm mode="signup" /> },
    ],
    []
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.vars.palette.background.body,
        padding,
      }}
    >
      <Sheet
        variant="outlined"
        sx={{
          maxWidth,
          width: "100%",
          borderRadius: theme.radius.xs,
          padding,
          backgroundColor: theme.vars.palette.background.surface,
          boxShadow: theme.vars.shadow.md,
        }}
      >
        <VStack spacing="24px" align="stretch">
          <Tabs
            value={tabIndex}
            onChange={(e, newValue) => setTabIndex(newValue)}
            aria-label="Authentication tabs"
            sx={{ backgroundColor: "transparent" }}
          >
            <TabList
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: "16px",
                "& .MuiTab-root": {
                  flex: 1,
                  borderRadius: theme.radius.xs,
                  fontSize: useBreakpointValue({ base: "0.875rem", md: "1rem" }),
                  "&.Mui-selected": {
                    backgroundColor: theme.vars.palette.primary[100],
                    color: theme.vars.palette.primary[500],
                    fontWeight: "600",
                  },
                  "&:hover": {
                    backgroundColor: theme.vars.palette.neutral[100],
                  },
                },
              }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={tab.label}
                  value={index}
                  aria-label={tab.label}
                  sx={{
                    color:
                      tabIndex === index
                        ? theme.vars.palette.primary[500]
                        : theme.vars.palette.text.primary,
                  }}
                >
                  <motion.div
                    animate={{ scale: tabIndex === index ? 1.05 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {tab.label}
                  </motion.div>
                </Tab>
              ))}
            </TabList>
            {tabs.map((tab, index) => (
              <TabPanel key={tab.label} value={index}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {tab.component}
                </motion.div>
              </TabPanel>
            ))}
          </Tabs>
        </VStack>
      </Sheet>
    </Box>
  );
};

export default AuthPage;