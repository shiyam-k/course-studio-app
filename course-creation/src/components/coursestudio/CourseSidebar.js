import React, { useState, useEffect, useCallback } from "react";
import { Sheet, List, ListItem, Accordion, AccordionSummary, AccordionDetails, Typography, IconButton, Box, Chip } from "@mui/joy";
import { useColorScheme } from "@mui/joy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { styled } from "@mui/joy/styles";
import theme from "../../styles/theme";
import { LiaCalendarWeekSolid } from "react-icons/lia";
import { FaFlag } from "react-icons/fa";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import axios from "axios";
import useStudioContext from "../../context/studio/StudioContext";
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
import ConvertToPDFButton from "./CoursePDF";

// Styled components
const SidebarContainer = styled(Sheet)(({ theme, isOpen }) => ({
  width: isOpen ? 400 : 60,
  height: "calc(100vh - 64px)",
  overflowY: isOpen ? "auto" : "hidden",
  padding: isOpen ? theme.spacing(2) : theme.spacing(1),
  backgroundColor: theme.palette.background.backdrop,
  boxShadow: theme.shadow.sm,
  position: "fixed",
  top: 64,
  left: 0,
  zIndex: 1000,
  transition: "width 0.3s ease",
  boxSizing: "border-box",
  "&::-webkit-scrollbar": { width: 4 },
  "&::-webkit-scrollbar-track": { backgroundColor: theme.palette.background.surface, borderRadius: theme.radius.sm },
  "&::-webkit-scrollbar-thumb": { backgroundColor: theme.palette.neutral[500], borderRadius: theme.radius.sm, "&:hover": { backgroundColor: theme.palette.primary[300] } },
  scrollbarWidth: "thin",
  scrollbarColor: `${theme.palette.neutral[500]} ${theme.palette.background.level1}`,
  margin: "1%",
}));

const ToggleButton = styled(IconButton)(({ theme }) => ({
  width: 40,
  height: 40,
  borderRadius: "50%",
  position: "absolute",
  top: theme.spacing(1.5),
  right: theme.spacing(1.5),
  backgroundColor: theme.palette.background.level1,
  color: theme.palette.text.primary,
  "&:hover": { backgroundColor: theme.palette.neutral[500] },
}));

const CollapseLink = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary[500],
  textDecoration: "underline",
  cursor: "pointer",
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 500,
  textAlign: "center",
  "&:hover": { color: theme.palette.primary[600], textDecoration: "underline" },
}));

const HeaderRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  position: "relative",
  marginBottom: theme.spacing(2),
  width: "40%",
  gap: theme.spacing(1),
}));

// BlockItem component
const BlockItem = React.memo(({ mode, block, blockId, courseId, weekName, moduleName, onUpdateBlock, setBlockDetails }) => {
  const [error, setError] = useState(null);

  const handleToggleComplete = useCallback(async () => {
    try {
      const response = await axios.put("http://localhost:8000/studio/update-blocks", {
        course_id: courseId,
        week_name: weekName,
        module_name: moduleName,
        block_name: block.block_name,
        update: !block.completed,
      });
      if (response.status === 200) {
        onUpdateBlock(blockId, !block.completed);
        setError(null);
      } else {
        throw new Error("Failed to update block");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Error updating block";
      setError(message);
      console.error("Error updating block:", error);
    }
  }, [blockId, block.completed, courseId, weekName, moduleName, onUpdateBlock]);

  const handleBlockClick = useCallback(() => {
    setBlockDetails({ blockName: block.block_name, moduleName, weekName });
  }, [block.block_name, moduleName, weekName, setBlockDetails]);

  return (
    <ListItem sx={{ paddingLeft: 4, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", cursor: "pointer" }} onClick={handleBlockClick}>
        <Typography level="title-sm" sx={{ color: mode === "light" ? theme.palette.neutral[600] : theme.palette.neutral[300], fontWeight: 500, width: "90%" }}>
          {block.block_name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip sx={{ borderRadius: "4px" }}>{block.block_minutes}</Chip>
          <IconButton
            variant="plain"
            sx={{ borderRadius: 4 }}
            size="sm"
            color={block.completed ? "success" : "neutral"}
            onClick={handleToggleComplete}
            aria-label={block.completed ? `Mark ${block.block_name} as incomplete` : `Mark ${block.block_name} as complete`}
          >
            <DoneAllIcon />
          </IconButton>
        </Box>
      </Box>
      {error && (
        <Typography level="body2" color="danger" sx={{ width: "100%" }}>
          {error}
        </Typography>
      )}
    </ListItem>
  );
});

// ModuleItem component
const ModuleItem = React.memo(({ mode, module, moduleId, allExpanded, courseId, weekName, onUpdateBlock, setBlockDetails }) => {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setExpanded(allExpanded);
  }, [allExpanded]);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <Accordion expanded={expanded} onChange={handleToggle}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography level="title-sm" sx={{ fontWeight: 600, color: mode === "light" ? theme.palette.neutral[700] : theme.palette.neutral[200] }} startDecorator={<PanoramaFishEyeIcon fontSize="small" />}>
          {module.module_name}
        </Typography>
        <Chip size="sm" sx={{ backgroundColor: mode === "light" ? theme.vars.palette.warning[600] : theme.vars.palette.warning[700], color: mode === "light" ? theme.vars.palette.neutral[100] : theme.vars.palette.neutral[200] }}>
          {module.module_hours} hrs
        </Chip>
      </AccordionSummary>
      <AccordionDetails>
        <List sx={{ width: "100%", gap: 1 }}>
          {module.blocks.map((block, index) => (
            <BlockItem
              mode={mode}
              key={index}
              block={{ ...block, block_index: index }}
              blockId={`${moduleId}.${index + 1}`}
              courseId={courseId}
              weekName={weekName}
              moduleName={module.module_name}
              onUpdateBlock={onUpdateBlock}
              setBlockDetails={setBlockDetails}
            />
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
});

// WeekItem component
const WeekItem = React.memo(({ mode, week, index, allExpanded, courseId, onUpdateBlock, setBlockDetails }) => {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setExpanded(allExpanded);
  }, [allExpanded]);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <Accordion expanded={expanded} onChange={handleToggle} aria-expanded={expanded}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography level="title-lg" sx={{ color: mode === "light" ? theme.palette.neutral[800] : theme.palette.neutral[100], fontWeight: 500 }}>
          {index + 1}. {week.week_topic}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <List sx={{ width: "100%" }}>
          {week.modules.map((module, idx) => (
            <ModuleItem
              mode={mode}
              key={idx}
              module={{ ...module, module_index: idx }}
              moduleId={`${index + 1}.${idx + 1}`}
              allExpanded={allExpanded}
              courseId={courseId}
              weekName={week.week_topic}
              onUpdateBlock={onUpdateBlock}
              setBlockDetails={setBlockDetails}
            />
          ))}
          <ListItem>
            <Typography level="body1" sx={{ fontWeight: 600, color: theme.palette.info[400] }} startDecorator={<FaFlag size="20px" />}>
              {week.week_milestone.milestone_name} ({week.week_milestone.milestone_minutes})
            </Typography>
          </ListItem>
        </List>
      </AccordionDetails>
    </Accordion>
  );
});

// Main StudioSidebar component
const StudioSidebar = ({ data }) => {
  const { mode } = useColorScheme();
  const { isSidebarOpen, setIsSidebarOpen, addBlockName, addWeekName, addModuleName, courseId } = useStudioContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allExpanded, setAllExpanded] = useState(true);
  const [courseData, setCourseData] = useState(data);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, [setIsSidebarOpen]);

  const handleUpdateBlock = useCallback((blockId, completed) => {
    setCourseData((prevData) => {
      const newData = { ...prevData };
      const [weekIdx, moduleIdx, blockIdx] = blockId.split(".").map(Number);
      newData.weeks[weekIdx - 1].modules[moduleIdx - 1].blocks[blockIdx - 1].completed = completed;
      return newData;
    });
  }, []);

  const setBlockDetails = useCallback(({ blockName, moduleName, weekName }) => {
    addBlockName(blockName);
    addModuleName(moduleName);
    addWeekName(weekName);
  }, [addBlockName, addModuleName, addWeekName]);

  if (loading) {
    return (
      <SidebarContainer isOpen={isSidebarOpen}>
        <ToggleButton onClick={toggleSidebar} aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}>
          {isSidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeftOpen size={24} />}
        </ToggleButton>
        {isSidebarOpen && (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography level="body1" sx={{ color: theme.palette.text.secondary }}>
              Loading...
            </Typography>
          </Box>
        )}
      </SidebarContainer>
    );
  }

  if (error) {
    return (
      <SidebarContainer isOpen={isSidebarOpen}>
        <ToggleButton onClick={toggleSidebar} aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}>
          {isSidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeftOpen size={24} />}
        </ToggleButton>
        {isSidebarOpen && (
          <Typography level="body1" color="danger">
            Error: {error}
          </Typography>
        )}
      </SidebarContainer>
    );
  }

  return (
    <SidebarContainer isOpen={isSidebarOpen}>
      <ToggleButton onClick={toggleSidebar} aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}>
        {isSidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeftOpen size={24} />}
      </ToggleButton>
      {isSidebarOpen && (
        <>
          <HeaderRow>
            <CollapseLink onClick={() => setAllExpanded((prev) => !prev)} aria-label={allExpanded ? "Collapse all sections" : "Expand all sections"}>
              {allExpanded ? "Collapse All" : "Expand All"}
            </CollapseLink>
            <ConvertToPDFButton courseId={courseId}/>
          </HeaderRow>
          <List sx={{ width: "100%", gap: 2 }}>
            {courseData.weeks.map((week, index) => (
              <WeekItem
                mode={mode}
                key={index}
                week={{ ...week, week_index: index }}
                index={index}
                allExpanded={allExpanded}
                courseId={courseData.course_id}
                onUpdateBlock={handleUpdateBlock}
                setBlockDetails={setBlockDetails}
              />
            ))}
            <ListItem sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <Typography level="body1" sx={{ fontWeight: 600, color: theme.vars.palette.primary[300] }}>
                {courseData.course_milestone.milestone_name}
              </Typography>
              <Chip size="sm" sx={{ backgroundColor: mode === "light" ? theme.vars.palette.warning[600] : theme.vars.palette.warning[700], color: mode === "light" ? theme.vars.palette.neutral[100] : theme.vars.palette.neutral[200] }}>
                {courseData.course_milestone.milestone_minutes}
              </Chip>
            </ListItem>
          </List>
        </>
      )}
    </SidebarContainer>
  );
};

export default StudioSidebar;