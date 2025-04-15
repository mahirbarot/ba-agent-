import axios from 'axios';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:3005/api';

const apiClient = {
  generateDocuments: async (requirements) => {
    try {
      console.log('Sending requirements to server:', requirements);
      const response = await axios.post(`${API_URL}/generate-documents`, { requirements });
      console.log('Server response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error generating documents:', error.response?.data || error.message);
      throw error;
    }
  },
  
  conductResearch: async (requirements) => {
    try {
      const response = await axios.post(`${API_URL}/conduct-research`, { requirements });
      return response.data;
    } catch (error) {
      console.error('Error conducting research:', error.response?.data || error.message);
      throw error;
    }
  },
  
  breakdownTasks: async (functionalRequirements) => {
    try {
      const response = await axios.post(`${API_URL}/breakdown-tasks`, { functionalRequirements });
      return response.data;
    } catch (error) {
      console.error('Error breaking down tasks:', error.response?.data || error.message);
      throw error;
    }
  },
  
  assignTasks: async (tasks, teamMembers) => {
    try {
      const response = await axios.post(`${API_URL}/assign-tasks`, { tasks, teamMembers });
      return response.data;
    } catch (error) {
      console.error('Error assigning tasks:', error.response?.data || error.message);
      throw error;
    }
  },
  
  createJiraTasks: async (assignedTasks, projectKey) => {
    try {
      const response = await axios.post(`${API_URL}/create-jira-tasks`, { assignedTasks, projectKey });
      return response.data;
    } catch (error) {
      console.error('Error creating Jira tasks:', error.response?.data || error.message);
      throw error;
    }
  },
};

export default apiClient;