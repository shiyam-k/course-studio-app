import { useState, useMemo } from "react";
import React from "react";
import { Box, HStack } from "@chakra-ui/react";
import {
  Button,
  Typography,
  Sheet,
  Avatar,
  IconButton as JoyIconButton,
} from "@mui/joy";
import { motion } from "framer-motion";
import { LightMode, DarkMode } from "@mui/icons-material";
import { NavLink } from "react-router-dom";
import { useColorScheme } from "@mui/joy/styles";
import reactLogo from "../assets/react-logo.png"; // Assume logo is in assets
import theme from "../styles/theme";
import { useNavigate } from "react-router-dom";

// ThemeToggle component
const ThemeToggle = () => {
  const { mode, setMode } = useColorScheme();
  const isDark = mode === "dark";

  return (
    <JoyIconButton
      onClick={() => setMode(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      sx={{ borderRadius: "50%" }}
    >
      {isDark ? <LightMode /> : <DarkMode />}
    </JoyIconButton>
  );
};

// Logo component
const Logo = () => (
  <Box display="flex" alignItems="center">
    <img
      src={reactLogo}
      alt="React Logo"
      width={40}
      height={40}
      loading="lazy"
      style={{ marginRight: "8px" }}
    />
    <Typography level="h3" sx={{ color: "var(--joy-palette-text-primary)" }}>
      Course Studio
    </Typography>
  </Box>
);

// NavButtons component
const NavButtons = () => {
  const navItems = ["Home", "Create Course", "Course Dashboard"];

  return (
    <HStack spacing={6}>
      {navItems.map((item) => (
        <motion.div
          key={item}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <NavLink
            to={item === "Home" ? "/" : (item === "Course Dashboard" ? "course-dashboard" : "/create-course")  }
            style={({ isActive }) => ({
              color: isActive
                ? theme.vars.palette.primary[500]
                : theme.vars.palette.text.primary,
              fontWeight: isActive ? "600" : "400",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: theme.radius.xs,
              "&:hover": {
                backgroundColor: theme.vars.palette.neutral[100],
              },
            })}
            aria-current={({ isActive }) => (isActive ? "page" : undefined)}
            aria-label={item}
          >
            {item}
          </NavLink>
        </motion.div>
      ))}
    </HStack>
  );
};

// Main Navbar component
const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // const handleLoginToggle = () => setIsLoggedIn(!isLoggedIn);

  const memoizedNavButtons = useMemo(() => <NavButtons />, []);

  const navigate = useNavigate();

  const handleLoginToggle = () => {
    navigate("/authentication");
  };

  return (
    <Sheet
      component="header"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingX: "16px",
        paddingY: "12px",
        backgroundColor: "var(--joy-palette-background-cardHeader)",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <HStack spacing="8px" width="100%" padding={"0 3% 0 1%"}>
        <Logo />
        <Box flex={1} display="flex" justifyContent="center">
          {memoizedNavButtons}
        </Box>
        <HStack spacing="8px">
          <Button
            variant="outlined"
            color="primary"
            aria-label="Log in"
            sx={{ borderRadius: theme.radius.xs }}
            onClick={handleLoginToggle}
          >
            Login
          </Button>
          <ThemeToggle />
        </HStack>
      </HStack>
    </Sheet>
  );
};

export default Navbar;
