import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Sheet,
  Typography,
  Chip,
  Tooltip,
  IconButton,
  Skeleton,
  Stack,
  LinearProgress,
} from "@mui/joy";
import Pagination from "@mui/material/Pagination";
import { Launch, Refresh, MoreVert } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import theme from "../../styles/theme";
import TimelapseIcon from "@mui/icons-material/Timelapse";
import { useColorScheme } from "@mui/joy";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/joy";
import useStudioContext from "../../context/studio/StudioContext";

const CourseCard = React.memo(({ course }) => {
  const { mode } = useColorScheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const maxSkills = 3;
  const visibleSkills = course.skills.slice(0, maxSkills);
  const additionalSkills = course.skills.length - maxSkills;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { addCourseId } = useStudioContext();

  const truncatedOverview = useMemo(() => {
    const words = course.overview.split(" ");
    return words.length > 30
      ? words.slice(0, 30).join(" ") + "..."
      : course.overview;
  }, [course.overview]);

  const fetchCourseData = async (courseId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/studio/course/${courseId}`
      );
      if (!response.ok) throw new Error("Failed to fetch course data");
      const result = await response.json();
      setData(result);
      console.log(result);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLaunchStudio = async (courseId) => {
    try {
      const result = await fetchCourseData(courseId);
      addCourseId(courseId);
      await new Promise((resolve) => setTimeout(resolve, 500));
      navigate(`/studio/${courseId}`, { state: { courseData: result } });
    } catch (err) {
      console.error("Error launching studio:", err);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.008, rotate: 0.1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ perspective: 1000 }}
    >
      <Sheet
        variant="outlined"
        className="article-card"
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          position: "relative",
          minHeight: "275px",
          maxWidth: "80%",
          width: "70%",
          mx: "auto",
          borderRadius: "12px",
          background: `linear-gradient(to bottom, ${
            mode === "light"
              ? theme.vars.palette.neutral[100]
              : theme.vars.palette.neutral[700]
          } 22%, ${theme.vars.palette.background.surface} 22%)`,
          transition: "all 0.3s ease",
          border: `1px solid ${theme.vars.palette.neutral[200]}`,
          "&:hover": {
            borderColor: theme.vars.palette.primary[500],
            boxShadow: theme.vars.shadow.lg,
          },
        }}
        role="article"
        aria-labelledby={`course-title-${course.course_id}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            level="h4"
            id={`course-title-${course.course_id}`}
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              color:
                mode === "light"
                  ? theme.vars.palette.primary[800]
                  : theme.vars.palette.primary[50],
              fontWeight: 700,
            }}
          >
            {course.title}
          </Typography>

          <Box sx={{ position: "absolute", top: 10, right: 30 }}>
            <AnimatePresence>
              {!isHovered ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <IconButton
                    size="sm"
                    sx={{
                      bgcolor:
                        mode === "light"
                          ? theme.vars.palette.neutral[200]
                          : theme.vars.palette.neutral[600],
                      borderRadius: "50%",
                      "&:hover": {
                        bgcolor:
                          mode === "light"
                            ? theme.vars.palette.neutral[300]
                            : theme.vars.palette.neutral[500],
                        transform: "scale(1.1)",
                      },
                    }}
                    aria-label={`Menu for course: ${course.title}`}
                  >
                    <MoreVert
                      sx={{ color: mode === "light" ? "black" : "white" }}
                    />
                  </IconButton>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Stack flexDirection={"row"} gap={1.5}>
                    <Tooltip title="Delete Course" placement="top">
                      <IconButton
                        size="sm"
                        sx={{
                          bgcolor:
                            mode === "light"
                              ? theme.vars.palette.danger[300]
                              : theme.vars.palette.danger[300],
                          borderRadius: "50%",
                          "&:hover": {
                            bgcolor: theme.vars.palette.danger[400],
                            transform: "scale(1.1)",
                          },
                        }}
                        aria-label={`Delete course: ${course.title}`}
                      >
                        <DeleteOutlineIcon sx={{ color: "white" }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Week Completion" placement="top">
                      <IconButton
                        size="sm"
                        sx={{
                          bgcolor:
                            mode === "light"
                              ? theme.vars.palette.warning[300]
                              : theme.vars.palette.warning[300],
                          borderRadius: "50%",
                          "&:hover": {
                            bgcolor: theme.vars.palette.warning[600],
                            transform: "scale(1.1)",
                          },
                        }}
                        aria-label={`Week completion for course: ${course.title}`}
                      >
                        <EventAvailableIcon sx={{ color: "white" }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Launch Studio" placement="top">
                      <IconButton
                        size="sm"
                        sx={{
                          bgcolor:
                            mode === "light"
                              ? theme.vars.palette.primary[300]
                              : theme.vars.palette.primary[300],
                          borderRadius: "50%",
                          "&:hover": {
                            bgcolor: theme.vars.palette.primary[600],
                            transform: "scale(1.1)",
                          },
                        }}
                        aria-label={`Launch course: ${course.title}`}
                        onClick={() => handleLaunchStudio(course.course_id)}
                      >
                        {loading ? (
                          <CircularProgress />
                        ) : (
                          <Launch sx={{ color: "white" }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Box>
        <Stack
          direction="row"
          alignItems="center"
          gap={6}
          sx={{ width: "100%" }}
        >
          {/* Left: Duration Label */}
          <Typography
            level="body2"
            startDecorator={<TimelapseIcon />}
            sx={{
              color: theme.vars.palette.text.tertiary,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {course.total_weeks} weeks
          </Typography>

          {/* Right: Progress bar with percentage */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ width: "60%" }}
          >
            <LinearProgress value={course?.course_progress} determinate />
            <Typography
              level="body2"
              sx={{
                minWidth: 35,
                textAlign: "right",
                fontWeight: 500,
                color: theme.vars.palette.text.primary,
              }}
            >
              {`${Math.round(course.course_progress)}%`}
            </Typography>
          </Stack>
        </Stack>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {visibleSkills.map((skill, index) => (
            <Chip
              key={index}
              className="topic-tag"
              size="sm"
              sx={{
                bgcolor:
                  mode === "light"
                    ? theme.vars.palette.neutral[200]
                    : theme.vars.palette.neutral[800],
                color:
                  mode === "light"
                    ? theme.vars.palette.neutral[700]
                    : theme.vars.palette.neutral[400],
                fontWeight: 500,
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              {skill.replace(/\*\*/g, "")}
            </Chip>
          ))}
          {additionalSkills > 0 && (
            <Chip
              size="sm"
              sx={{
                bgcolor:
                  mode === "light"
                    ? theme.vars.palette.neutral[400]
                    : theme.vars.palette.neutral[200],
                color:
                  mode === "light"
                    ? theme.vars.palette.neutral[200]
                    : theme.vars.palette.neutral[800],
                fontWeight: 500,
              }}
            >
              +{additionalSkills}
            </Chip>
          )}
        </Box>
        <Typography
          level="body-md"
          sx={{
            lineHeight: 1.7,
            color: theme.vars.palette.text.secondary,
          }}
        >
          <AnimatePresence>
            {isExpanded ? (
              <motion.div
                initial={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {course.overview}
              </motion.div>
            ) : (
              <motion.div
                initial={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {truncatedOverview}
              </motion.div>
            )}
          </AnimatePresence>
        </Typography>
        {course.overview.split(" ").length > 30 && (
          <Typography
            level="title-sm"
            sx={{
              color: theme.vars.palette.primary[500],
              cursor: "pointer",
              fontWeight: 600,
              textDecoration: "underline",
              transition: "color 0.2s",
              "&:hover": { color: theme.vars.palette.primary[600] },
            }}
            onClick={() => setIsExpanded(!isExpanded)}
            role="button"
            aria-expanded={isExpanded}
            aria-controls={`overview-${course.course_id}`}
          >
            {isExpanded ? "Read Less" : "Read More"}
          </Typography>
        )}
      </Sheet>
    </motion.div>
  );
});

const SkeletonCard = () => (
  <Sheet
    variant="outlined"
    sx={{
      p: 4,
      minHeight: "350px",
      maxWidth: "80%",
      mx: "auto",
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      gap: 3,
    }}
  >
    <Skeleton variant="rectangular" height={40} width="60%" />
    <Skeleton variant="text" width="20%" />
    <Box sx={{ display: "flex", gap: 1 }}>
      <Skeleton variant="rectangular" height={24} width={80} />
      <Skeleton variant="rectangular" height={24} width={80} />
      <Skeleton variant="rectangular" height={24} width={80} />
    </Box>
    <Skeleton variant="text" height={60} />
    <Skeleton variant="text" width="10%" />
  </Sheet>
);

const CourseCards = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const coursesPerPage = 6;

  const fetchCourses = async () => {
    try {
      const response = await axios.get("http://localhost:8000/studio/courses", {
        timeout: 10000,
      });
      setCourses(response.data);
      setLoading(false);
    } catch (err) {
      setError(
        "Failed to load courses. Please check your connection and try again."
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchCourses();
  };

  const paginatedCourses = courses.slice(
    (page - 1) * coursesPerPage,
    page * coursesPerPage
  );

  if (loading) {
    return (
      <Box
        sx={{
          p: 4,
          bgcolor: theme.vars.palette.background.body,
          minHeight: "100vh",
        }}
      >
        {Array.from({ length: 2 }).map((_, index) => (
          <Box key={index} sx={{ mb: 4 }}>
            <SkeletonCard />
          </Box>
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
          minHeight: "100vh",
          bgcolor: theme.vars.palette.background.body,
        }}
      >
        <Typography
          level="h4"
          sx={{ color: theme.vars.palette.danger[700], mb: 2 }}
        >
          {error}
        </Typography>
        <IconButton
          onClick={handleRetry}
          sx={{
            bgcolor: theme.vars.palette.primary[500],
            color: theme.vars.palette.common.white,
            "&:hover": {
              bgcolor: theme.vars.palette.primary[600],
            },
          }}
          aria-label="Retry loading courses"
        >
          <Refresh />
        </IconButton>
      </Box>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
          minHeight: "100vh",
          bgcolor: theme.vars.palette.background.body,
        }}
      >
        <Typography
          level="h4"
          sx={{ color: theme.vars.palette.neutral[700], mb: 2 }}
        >
          No courses available at the moment.
        </Typography>
        <Typography
          level="body1"
          sx={{ color: theme.vars.palette.neutral[600] }}
        >
          Please check back later or try refreshing.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 4,
        bgcolor: theme.vars.palette.background.body,
        minHeight: "100vh",
      }}
    >
      {paginatedCourses.map((course) => (
        <Box key={course.course_id} sx={{ mb: 2 }}>
          <CourseCard course={course} />
        </Box>
      ))}
      {courses.length > coursesPerPage && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={Math.ceil(courses.length / coursesPerPage)}
            page={page}
            onChange={(event, value) => setPage(value)}
            sx={{
              "& .MuiPaginationItem-root": {
                color: theme.vars.palette.primary[500],
                "&.Mui-selected": {
                  bgcolor: theme.vars.palette.primary[500],
                  color: theme.vars.palette.common.white,
                },
              },
            }}
            aria-label="Course pagination"
          />
        </Box>
      )}
    </Box>
  );
};

export default CourseCards;
