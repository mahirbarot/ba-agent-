// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  List,
  ListItem, 
  ListItemText, 
  Grid, 
  Tabs, 
  Tab, 
  CircularProgress,
  Chip,
  Divider,
  Avatar,
  IconButton,
  useMediaQuery,
  CssBaseline,
  Badge
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import apiClient from './services/api';
import AIVideoInterface from './components/AIVideoInterface';
import NaturalTextToSpeech from './components/NaturalTextToSpeech';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#2563eb' : '#60a5fa',
      light: mode === 'light' ? '#60a5fa' : '#93c5fd',
      dark: mode === 'light' ? '#1d4ed8' : '#3b82f6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: mode === 'light' ? '#7c3aed' : '#a78bfa',
      light: mode === 'light' ? '#a78bfa' : '#c4b5fd',
      dark: mode === 'light' ? '#6d28d9' : '#8b5cf6',
      contrastText: '#ffffff',
    },
    background: {
      default: mode === 'light' ? '#f8fafc' : '#0f172a',
      paper: mode === 'light' ? '#ffffff' : '#1e293b',
    },
    text: {
      primary: mode === 'light' ? '#1e293b' : '#f8fafc',
      secondary: mode === 'light' ? '#475569' : '#cbd5e1',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
  },
});

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(prefersDarkMode ? 'dark' : 'light');
  const theme = React.useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [businessRequirements, setBusinessRequirements] = useState('');
  const [documents, setDocuments] = useState(null);
  const [researchResults, setResearchResults] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: "Alice Johnson", skills: ["Frontend Development", "UI/UX Design", "React"] },
    { id: 2, name: "Bob Smith", skills: ["Backend Development", "Database Design", "API Design", "Node.js"] },
    { id: 3, name: "Charlie Brown", skills: ["QA", "Testing", "Automation"] },
    { id: 4, name: "Diana Miller", skills: ["Project Management", "Business Analysis", "Documentation"] }
  ]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [jiraTasks, setJiraTasks] = useState([]);
  const [jiraProjectKey, setJiraProjectKey] = useState('PROJ');
  const [newTeamMember, setNewTeamMember] = useState({ name: '', skills: '' });
  const [editingMember, setEditingMember] = useState(null);
  const [videoCall, setVideoCall] = useState(false);
  const [projectContext, setProjectContext] = useState(null);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleRequirementsSubmit = async () => {
    if (!businessRequirements.trim()) return;
    
    setLoading(true);
    try {
      const docs = await apiClient.generateDocuments(businessRequirements);
      setDocuments({ ...docs, selectedDocType: 0 });
      
      const research = await apiClient.conductResearch(businessRequirements);
      setResearchResults(research);
      
      const taskBreakdown = await apiClient.breakdownTasks(docs.frd);
      setTasks(taskBreakdown);
      
      setCurrentTab(1); // Switch to Documents tab
    } catch (error) {
      console.error("Error processing requirements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamMemberAdd = () => {
    if (!newTeamMember.name || !newTeamMember.skills) return;
    
    const skills = newTeamMember.skills.split(',').map(skill => skill.trim());
    const newMember = {
      id: teamMembers.length + 1,
      name: newTeamMember.name,
      skills: skills
    };
    
    setTeamMembers([...teamMembers, newMember]);
    setNewTeamMember({ name: '', skills: '' });
  };

  const handleTeamMemberEdit = (member) => {
    setEditingMember({
      ...member,
      skills: member.skills.join(', ')
    });
    setNewTeamMember({
      name: member.name,
      skills: member.skills.join(', ')
    });
  };

  const handleTeamMemberUpdate = () => {
    if (!newTeamMember.name || !newTeamMember.skills) return;
    
    const skills = newTeamMember.skills.split(',').map(skill => skill.trim());
    const updatedMembers = teamMembers.map(member => 
      member.id === editingMember.id 
        ? { ...member, name: newTeamMember.name, skills: skills }
        : member
    );
    
    setTeamMembers(updatedMembers);
    setNewTeamMember({ name: '', skills: '' });
    setEditingMember(null);
  };

  const handleTeamMemberDelete = (memberId) => {
    const updatedMembers = teamMembers.filter(member => member.id !== memberId);
    setTeamMembers(updatedMembers);
  };

  const handleTaskAssignment = async () => {
    if (tasks.length === 0) return;
    
    setLoading(true);
    try {
      const assignments = await apiClient.assignTasks(tasks, teamMembers);
      setAssignedTasks(assignments);
      setCurrentTab(3); // Switch to Tasks tab
    } catch (error) {
      console.error("Error assigning tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJiraTaskCreation = async () => {
    if (assignedTasks.length === 0) return;
    
    setLoading(true);
    try {
      const jira = await apiClient.createJiraTasks(assignedTasks, jiraProjectKey);
      setJiraTasks(jira);
    } catch (error) {
      console.error("Error creating Jira tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageFromAI = (message) => {
    // Handle messages received from AI Video Interface
    console.log('Message from AI:', message);
  };

  const toggleVideoCall = () => {
    setVideoCall(!videoCall);
    // Update project context when video call is started
    if (!videoCall) {
      setProjectContext({
        projectName,
        businessRequirements,
        teamMembers,
        tasks: assignedTasks
      });
    }
  };

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <Box 
        sx={{ 
          minHeight: '100vh',
          bgcolor: 'background.default',
          transition: 'background-color 0.3s ease'
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4, position: "static", top: 0, left: 0, width: "100%" }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 4 
          }}>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(45deg, #60a5fa 30%, #a78bfa 90%)'
                  : 'linear-gradient(45deg, #2563eb 30%, #7c3aed 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                fontWeight: 700,
                letterSpacing: '-0.02em'
              }}
            >
              Business Analyst AI-Agent
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<VideoCallIcon />}
                onClick={toggleVideoCall}
                sx={{
                  borderRadius: '12px',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[2],
                  },
                }}
              >
                {videoCall ? "End Video Call" : "Start AI Video Call"}
              </Button>
              
              <IconButton 
                onClick={toggleColorMode} 
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  },
                }}
              >
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Box>
          </Box>
          
          {videoCall && (
            <AIVideoInterface
              isActive={videoCall}
              projectContext={projectContext}
              onMessageReceived={handleMessageFromAI}
            />
          )}
          
          <Paper 
            elevation={0}
            sx={{ 
              width: '100%', 
              mb: 3,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          >
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange} 
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  py: 2,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  '&.Mui-selected': {
                    fontWeight: 600,
                  },
                },
              }}
            >
              <Tab icon={<AssignmentIcon />} label="Requirements" />
              <Tab icon={<DescriptionIcon />} label="Documents" />
              <Tab icon={<GroupIcon />} label="Team" />
              <Tab icon={<AccountTreeIcon />} label="Tasks" />
            </Tabs>
          </Paper>
          
          {currentTab === 0 && (
            <Paper 
              sx={{ 
                p: 3, 
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <Typography variant="h6" gutterBottom>
                Business Requirements Analysis
              </Typography>
              <TextField
                fullWidth
                label="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Enter Business Requirements"
                value={businessRequirements}
                onChange={(e) => setBusinessRequirements(e.target.value)}
                margin="normal"
                placeholder="Describe your project requirements in detail. The AI will analyze them to generate documentation and technical tasks."
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleRequirementsSubmit}
                disabled={loading || !businessRequirements.trim()}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : "Process Requirements"}
              </Button>
            </Paper>
          )}
          
          {currentTab === 1 && (
            <Paper 
              sx={{ 
                p: 3, 
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <Typography variant="h6" gutterBottom>
                Generated Documents
              </Typography>
              
              {documents ? (
                <Box>
                  <Tabs 
                    value={documents.selectedDocType || 0} 
                    onChange={(e, newValue) => setDocuments({...documents, selectedDocType: newValue})} 
                    indicatorColor="secondary" 
                    textColor="secondary"
                    sx={{
                      '& .MuiTab-root': {
                        minHeight: '48px',
                        py: 1,
                        px: 2
                      }
                    }}
                  >
                    <Tab 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Badge 
                            color="primary" 
                            variant="dot" 
                            invisible={!documents.srs}
                          >
                            Software Requirements Specification
                          </Badge>
                        </Box>
                      } 
                    />
                    <Tab 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Badge 
                            color="primary" 
                            variant="dot" 
                            invisible={!documents.frd}
                          >
                            Functional Requirements
                          </Badge>
                        </Box>
                      } 
                    />
                    <Tab 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Badge 
                            color="primary" 
                            variant="dot" 
                            invisible={!documents.brd}
                          >
                            Business Requirements
                          </Badge>
                        </Box>
                      } 
                    />
                    <Tab 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Badge 
                            color="primary" 
                            badgeContent={documents.umlDiagrams?.length || 0}
                            max={99}
                            showZero
                          >
                            UML Diagrams
                          </Badge>
                        </Box>
                      } 
                    />
                  </Tabs>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f5f5', borderRadius: 1 }}>
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <>
                        {documents.selectedDocType === 0 && (
                          <Typography variant="body1" component="pre" sx={{ 
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            lineHeight: 1.6
                          }}>
                            {documents.srs || 'No SRS document available'}
                          </Typography>
                        )}
                        {documents.selectedDocType === 1 && (
                          <Typography variant="body1" component="pre" sx={{ 
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            lineHeight: 1.6
                          }}>
                            {documents.frd || 'No Functional Requirements document available'}
                          </Typography>
                        )}
                        {documents.selectedDocType === 2 && (
                          <Typography variant="body1" component="pre" sx={{ 
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            lineHeight: 1.6
                          }}>
                            {documents.brd || 'No Business Requirements document available'}
                          </Typography>
                        )}
                        {documents.selectedDocType === 3 && (
                          <Box>
                            {documents.umlDiagrams && documents.umlDiagrams.length > 0 ? (
                              documents.umlDiagrams.map((diagram, index) => (
                                <Box key={index} sx={{ 
                                  mb: 3,
                                  p: 2,
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'white',
                                  borderRadius: 1,
                                  border: `1px solid ${theme.palette.divider}`
                                }}>
                                  <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
                                    {diagram.name}
                                  </Typography>
                                  <Typography variant="body1" component="pre" sx={{ 
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: 'monospace',
                                    fontSize: '0.9rem',
                                    lineHeight: 1.6
                                  }}>
                                    {diagram.content}
                                  </Typography>
                                </Box>
                              ))
                            ) : (
                              <Typography variant="body1" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                                No UML diagrams available
                              </Typography>
                            )}
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                  
                  <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                    Competitive Research
                  </Typography>
                  
                  {researchResults && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                          Market Analysis:
                        </Typography>
                        <Typography variant="body2">
                          {researchResults.marketTrends}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                          Competitor Analysis:
                        </Typography>
                        <List>
                          {researchResults.competitors.map((competitor, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={competitor.name}
                                secondary={
                                  <>
                                    <b>Strengths:</b> {competitor.strengths}<br />
                                    <b>Weaknesses:</b> {competitor.weaknesses}
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                          Recommendations:
                        </Typography>
                        <Typography variant="body2">
                          {researchResults.recommendations}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                          SWOT Analysis:
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={3}>
                            <Paper sx={{ p: 2 }}>
                              <Typography variant="h6">Strengths</Typography>
                              <Typography variant="body2">{researchResults.swotAnalysis.strengths.join(', ')}</Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={3}>
                            <Paper sx={{ p: 2 }}>
                              <Typography variant="h6">Weaknesses</Typography>
                              <Typography variant="body2">{researchResults.swotAnalysis.weaknesses.join(', ')}</Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={3}>
                            <Paper sx={{ p: 2 }}>
                              <Typography variant="h6">Opportunities</Typography>
                              <Typography variant="body2">{researchResults.swotAnalysis.opportunities.join(', ')}</Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={3}>
                            <Paper sx={{ p: 2 }}>
                              <Typography variant="h6">Threats</Typography>
                              <Typography variant="body2">{researchResults.swotAnalysis.threats.join(', ')}</Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  )}
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => setCurrentTab(2)}
                    sx={{ mt: 3 }}
                  >
                    Continue to Team Setup
                  </Button>
                </Box>
              ) : (
                <Typography variant="body1" color="textSecondary">
                  Process your requirements to generate documents.
                </Typography>
              )}
            </Paper>
          )}
          
          {currentTab === 2 && (
            <Paper 
              sx={{ 
                p: 3, 
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <Typography variant="h6" gutterBottom>
                Team Members and Skills
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                  <Typography variant="subtitle1" gutterBottom>
                    {editingMember ? 'Edit Team Member:' : 'Add Team Member:'}
                  </Typography>
                  <TextField
                    fullWidth
                    label="Name"
                    value={newTeamMember.name}
                    onChange={(e) => setNewTeamMember({...newTeamMember, name: e.target.value})}
                    margin="normal"
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="Skills (comma separated)"
                    value={newTeamMember.skills}
                    onChange={(e) => setNewTeamMember({...newTeamMember, skills: e.target.value})}
                    margin="normal"
                    size="small"
                    placeholder="e.g. JavaScript, React, UI Design"
                  />
                  {editingMember ? (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleTeamMemberUpdate}
                        disabled={!newTeamMember.name || !newTeamMember.skills}
                      >
                        Update Member
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="secondary" 
                        onClick={() => {
                          setEditingMember(null);
                          setNewTeamMember({ name: '', skills: '' });
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleTeamMemberAdd}
                      disabled={!newTeamMember.name || !newTeamMember.skills}
                      sx={{ mt: 1 }}
                    >
                      Add Member
                    </Button>
                  )}
                </Grid>
                
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle1" gutterBottom>
                    Team Members:
                  </Typography>
                  <List>
                    {teamMembers.map((member) => (
                      <ListItem 
                        key={member.id} 
                        divider
                        sx={{
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' 
                              ? 'rgba(255,255,255,0.05)' 
                              : 'rgba(0,0,0,0.02)',
                          },
                        }}
                      >
                        <ListItemText
                          primary={member.name}
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              {member.skills.map((skill) => (
                                <Chip 
                                  key={skill} 
                                  label={skill} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ mr: 0.5, mb: 0.5 }} 
                                />
                              ))}
                            </Box>
                          }
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => handleTeamMemberEdit(member)}
                            disabled={editingMember !== null}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleTeamMemberDelete(member.id)}
                            disabled={editingMember !== null}
                          >
                            Delete
                          </Button>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleTaskAssignment}
                    disabled={loading || teamMembers.length === 0 || tasks.length === 0}
                    sx={{ mt: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : "Assign Tasks to Team"}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}
          
          {currentTab === 3 && (
            <Paper 
              sx={{ 
                p: 3, 
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <Typography variant="h6" gutterBottom>
                Tasks and Assignments
              </Typography>
              
              {assignedTasks.length > 0 ? (
                <>
                  <List
                    sx={{
                      '& .MuiListItem-root': {
                        borderRadius: '12px',
                        mb: 1,
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.05)' 
                            : 'rgba(0,0,0,0.02)',
                        },
                      },
                    }}
                  >
                    {assignedTasks.map((task) => (
                      <ListItem key={task.id} divider>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center">
                              <Typography variant="subtitle1">{task.name}</Typography>
                              <Chip 
                                size="small" 
                                label={`Assigned to: ${task.assignedTo}`}
                                color="primary"
                                sx={{ ml: 2 }}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2">{task.description}</Typography>
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" color="textSecondary">
                                  Estimated: {task.estimatedHours} hours | Skills: {task.requiredSkills.join(', ')}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Match confidence: {task.confidence.toFixed(0)}%
                                </Typography>
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Create Tasks in Jira
                    </Typography>
                    <TextField
                      label="Jira Project Key"
                      value={jiraProjectKey}
                      onChange={(e) => setJiraProjectKey(e.target.value)}
                      margin="normal"
                      size="small"
                      sx={{ mr: 2 }}
                    />
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleJiraTaskCreation}
                      disabled={loading || !jiraProjectKey}
                    >
                      {loading ? <CircularProgress size={24} /> : "Create Jira Tasks"}
                    </Button>
                  </Box>
                  
                  {jiraTasks.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Jira Tasks Created:
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                        <List dense>
                          {jiraTasks.map((task) => (
                            <ListItem key={task.id}>
                              <ListItemText
                                primary={`${task.id}: ${task.summary}`}
                                secondary={`Assigned to: ${task.assignee} | Status: ${task.status}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Box>
                  )}
                </>
              ) : (
                <Typography variant="body1" color="textSecondary">
                  Go to the Team tab to assign tasks to team members.
                </Typography>
              )}
            </Paper>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;