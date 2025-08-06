import { useState, useCallback } from "react";
import { VStack, useBreakpointValue } from "@chakra-ui/react";
import { Button, Input, Typography, Sheet } from "@mui/joy";
import { Email, Person, Lock } from "@mui/icons-material";
import { motion } from "framer-motion";
import theme from "../../styles/theme";
import GoogleLogin from "./GoogleLogin";

const AuthForm = ({ mode = "login" }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  const [isUsernameTouched, setIsUsernameTouched] = useState(false);
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);

  const isSignup = mode === "signup";
  const padding = useBreakpointValue({ base: "16px", md: "24px" });
  const fontSize = useBreakpointValue({ base: "0.875rem", md: "1rem" });

  const validateEmail = useCallback((value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }, []);

  const validateUsername = useCallback((value) => {
    return value.length >= 3;
  }, []);

  const validatePassword = useCallback((value) => {
    return value.length >= 6;
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (isSignup) {
        if (validateEmail(email) && validateUsername(username) && validatePassword(password)) {
          console.log("Signup:", { email, username, password });
        }
      } else {
        if (validateEmail(email) && validatePassword(password)) {
          console.log("Login:", { email, password });
        }
      }
    },
    [email, username, password, isSignup, validateEmail, validateUsername, validatePassword]
  );

  const isEmailValid = validateEmail(email);
  const isUsernameValid = isSignup ? validateUsername(username) : true;
  const isPasswordValid = validatePassword(password);

  return (
    <VStack
      spacing="16px"
      align="stretch"
      sx={{
        padding,
        backgroundColor: theme.vars.palette.background.surface,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Input
          startDecorator={<Email />}
          placeholder="Enter your email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setIsEmailTouched(false)}
          onBlur={() => setIsEmailTouched(true)}
          required
          aria-label="Email address"
          aria-describedby={isEmailTouched && !isEmailValid ? "email-error" : undefined}
          sx={{
            borderRadius: theme.radius.xs,
            "& .MuiInputBase-root": {
              backgroundColor: theme.vars.palette.background.surface,
              fontSize,
            },
          }}
        />
        {isEmailTouched && !isEmailValid && (
          <Typography
            level="body2"
            id="email-error"
            sx={{ color: theme.vars.palette.danger[500], fontSize: "0.75rem" }}
          >
            Please enter a valid email address
          </Typography>
        )}
      </motion.div>
      {isSignup && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Input
            startDecorator={<Person />}
            placeholder="Choose a username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setIsUsernameTouched(false)}
            onBlur={() => setIsUsernameTouched(true)}
            required
            aria-label="Username"
            aria-describedby={isUsernameTouched && !isUsernameValid ? "username-error" : undefined}
            sx={{
              borderRadius: theme.radius.xs,
              "& .MuiInputBase-root": {
                backgroundColor: theme.vars.palette.background.surface,
                fontSize,
              },
            }}
          />
          {isUsernameTouched && !isUsernameValid && (
            <Typography
              level="body2"
              id="username-error"
              sx={{ color: theme.vars.palette.danger[500], fontSize: "0.75rem" }}
            >
              Username must be at least 3 characters
            </Typography>
          )}
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: isSignup ? 0.2 : 0.1 }}
      >
        <Input
          startDecorator={<Lock />}
          placeholder="Enter your password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setIsPasswordTouched(false)}
          onBlur={() => setIsPasswordTouched(true)}
          required
          aria-label="Password"
          aria-describedby={isPasswordTouched && !isPasswordValid ? "password-error" : undefined}
          sx={{
            borderRadius: theme.radius.xs,
            "& .MuiInputBase-root": {
              backgroundColor: theme.vars.palette.background.surface,
              fontSize,
            },
          }}
        />
        {isPasswordTouched && !isPasswordValid && (
          <Typography
            level="body2"
            id="password-error"
            sx={{ color: theme.vars.palette.danger[500], fontSize: "0.75rem" }}
          >
            Password must be at least 6 characters
          </Typography>
        )}
      </motion.div>
      <Button
        variant="solid"
        color="primary"
        onClick={handleSubmit}
        disabled={!isEmailValid || !isUsernameValid || !isPasswordValid}
        sx={{
          borderRadius: theme.radius.xs,
          backgroundColor: theme.vars.palette.primary[500],
          "&:hover": {
            backgroundColor: theme.vars.palette.primary[600],
          },
          fontSize,
        }}
        aria-label={isSignup ? "Sign up" : "Log in"}
      >
        {isSignup ? "Sign Up" : "Log In"}
      </Button>
      {isSignup && (
        <Sheet
          variant="plain"
          sx={{
            display: "flex",
            justifyContent: "center",
            padding: "16px",
            backgroundColor: theme.vars.palette.background.level1,
            borderRadius: theme.radius.xs,
          }}
        >
          <GoogleLogin
            onSuccess={(response) => console.log("Google Login Success:", response)}
            onError={(error) => console.log("Google Login Error:", error)}
          />
        </Sheet>
      )}
    </VStack>
  );
};

export default AuthForm;