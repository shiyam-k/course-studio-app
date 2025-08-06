import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  Box,
  Typography,
  Textarea,
  IconButton,
  Button,
  Card,
  Alert,
  Divider,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemDecorator,
  ListDivider,
} from "@mui/joy";
import { useColorScheme } from "@mui/joy";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import EditNoteIcon from "@mui/icons-material/EditNote";
import NorthIcon from "@mui/icons-material/North";
import ArrowRight from "@mui/icons-material/ArrowRight";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { styled } from "@mui/joy/styles";
import theme from "../../styles/theme";
import useStudioContext from "../../context/studio/StudioContext";
import axios from "axios";

// Model map for selector
const MODEL_MAP = {
  1: "gemini-2.5-pro",
  2: "gemini-2.5-flash",
  gemma: "gemma",
};

// Styled components
const ChatContainer = styled(Box)(({ theme, chatWidth, isSidebarOpen }) => ({
  width: chatWidth,
  height: "calc(92vh)",
  backgroundColor: theme.palette.background.popup,
  boxShadow: theme.shadow.sm,
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  overflow: "hidden",
  transition: "width 0.3s ease, margin-left 0.3s ease",
  marginLeft: isSidebarOpen ? "300px" : "50px",
  position: "relative",
  left: 0,
  justifyContent: "center",
  alignItems: "center",
}));

const MessageContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  "&::-webkit-scrollbar": { width: 6 },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.palette.background.surface,
    borderRadius: "2px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.neutral[500],
    borderRadius: "2px",
    "&:hover": { backgroundColor: theme.palette.neutral[600] },
  },
  scrollbarWidth: "thin",
  scrollbarColor: `${theme.palette.neutral[500]} ${theme.palette.background.level1}`,
  width: "80%",
  height: "100%",
  lineHeight: "2",
}));

const MessageBubble = styled(motion.div)(({ theme, isUser }) => ({
  backgroundColor: isUser
    ? theme.palette.background.level2
    : theme.palette.background.popup,
  color: isUser ? theme.palette.text.primary : theme.palette.text.secondary,
  borderRadius: "4px",
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  maxWidth: "80%",
  alignSelf: isUser ? "flex-end" : "flex-start",
  boxShadow: theme.shadow.xs,
  "& h1, & h2, & h3, & h4, & h5, & h6": {
    color: isUser ? theme.palette.text.inverse : theme.palette.text.primary,
    fontWeight: 600,
    margin: theme.spacing(1, 0),
  },
  "& p": {
    fontSize: theme.typography.body1.fontSize,
    margin: theme.spacing(0.5, 0),
  },
  "& ul, & ol": {
    margin: theme.spacing(0.5, 0),
    paddingLeft: theme.spacing(3),
  },
  "& li": { fontSize: theme.typography.body1.fontSize },
  margin: "5%",
}));

const InputContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.surface,
  borderRadius: "16px",
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.neutral[300]}`,
  transition: "border-color 0.2s ease",
  "&:focus-within": { borderColor: theme.palette.neutral[500] },
  width: "80%",
  margin: "16px auto",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  height: "120px",
}));

const ChatTextarea = styled(Textarea)(({ theme }) => ({
  backgroundColor: "transparent",
  color: theme.palette.text.primary,
  fontSize: theme.typography.body1.fontSize,
  resize: "none",
  border: "none",
  paddingTop: theme.spacing(1),
  "&::placeholder": { transform: "translateY(-2px)", opacity: 0.8 },
  "&:focus": { boxShadow: "none", outline: "none" },
  flex: 1,
  bottom: 15,
}));

const SendButton = styled(IconButton)(({ theme, mode }) => ({
  backgroundColor: theme.palette.neutral[500],
  borderRadius: "50%",
  width: 40,
  height: 40,
  flexShrink: 0,
  transition: "transform 0.2s ease",
  "&:hover": {
    backgroundColor: theme.palette.neutral[600],
    transform: "scale(1.05)",
  },
  "&:disabled": { backgroundColor: "transparent", cursor: "not-allowed" },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: "transparent",
  color: theme.palette.neutral[500],
  borderRadius: "50%",
  width: 32,
  height: 32,
}));

const BlockCard = styled(Card)(({ theme }) => ({
  width: "auto",
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.level1,
  boxShadow: theme.shadow.xs,
  margin: "auto",
}));

const LoadingOverlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: theme.palette.background.popup,
  opacity: 0.8,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
}));

const CourseChat = () => {
  const { mode } = useColorScheme();
  const {
    chatWidth,
    isSidebarOpen,
    courseId,
    weekName,
    moduleName,
    blockName,
  } = useStudioContext();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [blockData, setBlockData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [courseModel, setCourseModel] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const messageContainerRef = useRef(null);

  const isValidSelection = weekName && moduleName && blockName;
  const isChatEmpty = blockData?.chat?.length === 0;

  const handleMenuOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleModelSelect = useCallback(
    (modelKey) => {
      setCourseModel(modelKey);
      handleMenuClose();
    },
    [handleMenuClose]
  );

  const getModelType = useCallback((modelKey) => {
    return modelKey === "gemma" ? 1 : 0;
  }, []);
  const fetchBlockData = async () => {
    setLoading(true);
    try {
      const response = await axios.patch(
        "http://localhost:8000/studio/get-block-details",
        {
          course_id: courseId,
          week_name: weekName,
          module_name: moduleName,
          block_name: blockName,
        }
      );
      if (response.status === 200) {
        setBlockData(response.data);
        setMessages(
          response.data.chat.flatMap(([userMsg, aiMsg]) => [
            { text: userMsg.message, isUser: true },
            { text: aiMsg.message, isUser: false },
          ])
        );
        setError(null);
      } else {
        throw new Error("Failed to fetch block details");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching block details");
      console.error("Error fetching block details:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (isValidSelection) {
      fetchBlockData();
    }
  }, [courseId, weekName, moduleName, blockName, isValidSelection]);

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !isValidSelection || !courseModel) return;

    setLoading(true);
    try {
      const modelType = getModelType(courseModel);
      const response = await axios.put(
        "http://localhost:8000/studio/chat-tutor",
        {
          query: input,
          model_type: modelType,
          model: MODEL_MAP[courseModel],
          course_id: courseId,
          week_name: weekName,
          module_name: moduleName,
          block_name: blockName,
        }
      );

      if (response.status === 200) {
        setMessages((prev) => [
          ...prev,
          { text: input, isUser: true },
          { text: response.data.message, isUser: false },
        ]);
        setInput("");
        setError(null);
        setTimeout(() => {
          messageContainerRef.current.scrollTop =
            messageContainerRef.current.scrollHeight;
        }, 0);
      } else {
        throw new Error("Failed to send chat message");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error sending chat message");
      console.error("Error sending chat message:", err);
    } finally {
      setLoading(false);
      fetchBlockData();
    }
  }, [
    input,
    isValidSelection,
    courseModel,
    courseId,
    weekName,
    moduleName,
    blockName,
    getModelType,
  ]);

  const handleStartChat = useCallback(async () => {
    if (!isValidSelection || !courseModel) return;

    setLoading(true);
    try {
      const modelType = getModelType(courseModel);
      const response = await axios.put(
        "http://localhost:8000/studio/chat-tutor",
        {
          query: blockData?.objectives?.join("\n\n") || "Start chat",
          model_type: modelType,
          model: MODEL_MAP[courseModel],
          course_id: courseId,
          week_name: weekName,
          module_name: moduleName,
          block_name: blockName,
        }
      );

      if (response.status === 200) {
        setMessages([{ text: response.data.message, isUser: false }]);
        setError(null);
      } else {
        throw new Error("Failed to start chat");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error starting chat");
      console.error("Error starting chat:", err);
    } finally {
      setLoading(false);
      fetchBlockData();
    }
  }, [
    isValidSelection,
    courseModel,
    courseId,
    weekName,
    moduleName,
    blockName,
    blockData,
    getModelType,
  ]);

  const handleCopy = useCallback((text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }, []);

  const renderedMessages = useMemo(
    () =>
      messages.map((msg, index) => (
        <MessageBubble
          key={index}
          isUser={msg.isUser}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          role="article"
          aria-label={`Message ${index + 1}`}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box flex={1}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.text}
              </ReactMarkdown>
            </Box>
            <Divider />
            {!msg.isUser && (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <ActionButton
                  onClick={() => handleCopy(msg.text)}
                  aria-label="Copy message"
                >
                  <ContentCopyIcon fontSize="small" />
                </ActionButton>
                <ActionButton aria-label="View notes">
                  <LibraryAddIcon fontSize="small" />
                </ActionButton>
                <ActionButton aria-label="Edit notes">
                  <EditNoteIcon fontSize="small" />
                </ActionButton>
              </Box>
            )}
          </Box>
        </MessageBubble>
      )),
    [messages, handleCopy]
  );

  return (
    <ChatContainer chatWidth={chatWidth} isSidebarOpen={isSidebarOpen}>
      {loading && (
        <LoadingOverlay>
          <CircularProgress size="lg" />
        </LoadingOverlay>
      )}
      <MessageContainer ref={messageContainerRef} aria-live="polite">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {!isValidSelection ? (
            <Alert color="warning" sx={{ width: "80%", margin: "auto" }}>
              Please select a block to start the chat.
            </Alert>
          ) : error ? (
            <Alert color="danger" sx={{ width: "80%", margin: "auto" }}>
              {error}
            </Alert>
          ) : isChatEmpty ? (
            <BlockCard>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {blockData?.objectives?.join("\n\n") || ""}
              </ReactMarkdown>
              <Button
                startDecorator={<PlayCircleOutlineIcon />}
                onClick={handleStartChat}
                sx={{ marginTop: theme.spacing(2) }}
                aria-label="Start chat"
                disabled={!courseModel}
              >
                Start
              </Button>
            </BlockCard>
          ) : (
            <AnimatePresence>{renderedMessages}</AnimatePresence>
          )}
        </Box>
      </MessageContainer>
      <InputContainer>
        <Button
          variant="outlined"
          color="neutral"
          onClick={handleMenuOpen}
          sx={{
            borderRadius: theme.radius.xs,
            py: "4px",
            position: "absolute",
            left: 8,
            top: 75,
            fontSize: "0.9rem",
            "&:hover": {
              backgroundColor: theme.vars.palette.neutral[100],
            },
          }}
          aria-label="Select model"
          aria-controls={anchorEl ? "model-selector-menu" : undefined}
          aria-haspopup="true"
        >
          {MODEL_MAP[courseModel] || "Select Model"}
        </Button>
        <Menu
          id="model-selector-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          sx={{
            borderRadius: theme.radius.xs,
            "--ListItemDecorator-size": "24px",
          }}
        >
          <MenuItem
            disabled
            sx={{
              fontWeight: "600",
              color: theme.vars.palette.text.primary,
            }}
          >
            Offline
          </MenuItem>
          <MenuItem
            onClick={() => handleModelSelect("gemma")}
            selected={courseModel === "gemma"}
            sx={{ pl: "32px" }}
          >
            <ListItemDecorator>
              <ArrowRight />
            </ListItemDecorator>
            Gemma
          </MenuItem>
          <ListDivider />
          <MenuItem
            disabled
            sx={{
              fontWeight: "600",
              color: theme.vars.palette.text.primary,
            }}
          >
            Online
          </MenuItem>
          {Object.entries(MODEL_MAP)
            .filter(([key]) => key !== "gemma")
            .map(([key, value]) => (
              <MenuItem
                key={key}
                onClick={() => handleModelSelect(parseInt(key))}
                selected={MODEL_MAP[courseModel] === value}
                sx={{ pl: "32px" }}
              >
                <ListItemDecorator>
                  <ArrowRight />
                </ListItemDecorator>
                {value}
              </MenuItem>
            ))}
        </Menu>
        <ChatTextarea
          value={input}
          onChange={handleInputChange}
          // onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          minRows={2}
          maxRows={6}
          sx={{ flex: 1 }}
          aria-label="Chat input"
          disabled={!isValidSelection || isChatEmpty || !courseModel}
        />
        <SendButton
          mode={mode}
          onClick={handleSend}
          disabled={
            !input.trim() || !isValidSelection || isChatEmpty || !courseModel
          }
          aria-label="Send message"
        >
          <NorthIcon sx={{ color: theme.palette.neutral[100] }} />
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
};

export default CourseChat;
