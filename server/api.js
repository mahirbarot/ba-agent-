// server/api.js
// With these updated imports
import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { Groq } from 'groq-sdk';

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Choose which LLM to use
const useLLM = process.env.LLM_PROVIDER || 'groq';

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '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',
});

// Document Generation Chain
const documentGenerationPrompt = PromptTemplate.fromTemplate(`
You are an expert business analyst and technical writer. Based on the following business requirements, 
create comprehensive documentation including:
1. Software Requirements Specification (SRS)
2. Functional Requirements Document (FRD)
3. Business Requirements Document (BRD)
4. UML Diagrams (described in text format that could be converted to diagrams)

Business Requirements:
{requirements}

You must respond with ONLY a valid JSON object using the following structure (replace the placeholder values with actual content):

RESPONSE FORMAT:
{{
  "srs": "<detailed SRS document content>",
  "frd": "<detailed FRD document content>",
  "brd": "<detailed BRD document content>",
  "umlDiagrams": [
    {{
      "name": "<diagram name>",
      "content": "<detailed diagram description>"
    }}
  ]
}}

Important: 
1. Do not include any text outside the JSON object
2. Ensure all strings are properly escaped
3. Use double quotes for all keys and string values
4. Make the response a single, valid JSON object
5. Replace all placeholder text (including < and > characters) with actual content
`);

// Helper function to use Groq for completions
async function getGroqCompletion(prompt) {
  try {
    console.log('Sending request to Groq API with prompt:', prompt);
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that always responds with valid JSON. Never include any text outside the JSON structure. Never include XML-like tags. Always use double quotes for keys and string values. Never include markdown formatting."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "deepseek-r1-distill-qwen-32b",
      temperature: 0.1, // Reduced temperature for more consistent JSON output
      max_tokens: 4096,
      top_p: 1,
      stream: false,
      stop: null
    });
    
    console.log('Received response from Groq:', chatCompletion);
    let content = chatCompletion.choices[0]?.message?.content || '';
    
    // Enhanced cleaning of the response
    content = content.trim();
    
    // Remove any markdown code block indicators
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any XML-like tags
    content = content.replace(/<[^>]*>/g, '');
    
    // Find the first { and last } to extract just the JSON part
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      content = content.slice(firstBrace, lastBrace + 1);
    }
    
    // Validate the JSON
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed); // Return stringified version of the parsed JSON
    } catch (parseError) {
      throw new Error(`Invalid JSON in response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error with Groq API:", error.message);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    throw new Error(`Groq API Error: ${error.message}`);
  }
}

// API Routes with Groq implementation
app.post('/api/generate-documents', async (req, res) => {
  try {
    console.log('Received generate-documents request:', req.body);
    const { requirements } = req.body;
    
    if (!requirements) {
      return res.status(400).json({ error: 'Requirements are required' });
    }

    const prompt = await documentGenerationPrompt.format({ requirements });
    console.log('Formatted prompt:', prompt);
    
    const completion = await getGroqCompletion(prompt);
    console.log('Raw completion:', completion);
    
    try {
      // Parse the JSON response
      const result = JSON.parse(completion);
      
      // Validate the response structure
      if (!result.srs || !result.frd || !result.brd || !Array.isArray(result.umlDiagrams)) {
        throw new Error('Invalid response structure from AI');
      }
      
      console.log('Parsed result:', result);
      res.json(result);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      console.error('Raw completion that failed to parse:', completion);
      res.status(500).json({ 
        error: 'Failed to parse AI response',
        details: parseError.message,
        rawResponse: completion
      });
    }
  } catch (error) {
    console.error('Error generating documents:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    res.status(500).json({ 
      error: error.message,
      stack: error.stack,
      details: 'Error occurred while processing the request'
    });
  }
});

app.post('/api/conduct-research', async (req, res) => {
  try {
    const { requirements } = req.body;
    const prompt = `
      You are an expert market researcher. Based on the following business requirements, 
      conduct a thorough competitive analysis and provide a SWOT analysis:
      
      Business Requirements:
      ${requirements}
      
      Provide your research in a structured JSON format with the following keys:
      competitors (an array of objects with name, strengths, and weaknesses),
      marketTrends (a detailed description of current market trends),
      recommendations (strategic recommendations based on the research),
      swotAnalysis (an object with strengths, weaknesses, opportunities, and threats)
    `;
    
    const completion = await getGroqCompletion(prompt);
    
    // Parse the JSON response
    const result = JSON.parse(completion);
    res.json(result);
  } catch (error) {
    console.error('Error conducting research:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/breakdown-tasks', async (req, res) => {
  try {
    const { functionalRequirements } = req.body;
    const prompt = `
      You are an expert technical project manager. Based on the following functional requirements, 
      break down the project into detailed technical tasks:
      
      Functional Requirements:
      ${functionalRequirements}
      
      For each task, provide:
      1. A descriptive name
      2. A detailed description
      3. Estimated hours required
      4. Required skills (as an array of skill names)
      
      Return your response as a JSON array of task objects, each with id, name, description, estimatedHours, and requiredSkills fields.
    `;
    
    const completion = await getGroqCompletion(prompt);
    
    // Parse the JSON response
    const result = JSON.parse(completion);
    res.json(result.tasks || result);
  } catch (error) {
    console.error('Error breaking down tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assign-tasks', async (req, res) => {
  try {
    const { tasks, teamMembers } = req.body;
    const prompt = `
      You are an expert resource manager. Assign the following tasks to team members based on their skills:
      
      Tasks:
      ${JSON.stringify(tasks)}
      
      Team Members:
      ${JSON.stringify(teamMembers)}
      
      For each task, determine the best team member based on skill match. 
      Calculate a confidence score (0-100) based on how well the team member's skills match the required skills.
      Return the tasks with assignedTo (member name) and confidence fields added as a JSON array.
    `;
    
    const completion = await getGroqCompletion(prompt);
    
    // Parse the JSON response
    const result = JSON.parse(completion);
    res.json(result.assignments || result);
  } catch (error) {
    console.error('Error assigning tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/create-jira-tasks', async (req, res) => {
  try {
    const { assignedTasks, projectKey } = req.body;
    
    // In a real implementation, this would connect to the Jira API
    // For demo purposes, we're simulating the response
    const jiraTasks = assignedTasks.map(task => ({
      id: `${projectKey}-${task.id}`,
      summary: task.name,
      description: task.description,
      assignee: task.assignedTo,
      estimatedHours: task.estimatedHours,
      status: "To Do",
      created: new Date().toISOString()
    }));
    
    res.json(jiraTasks);
  } catch (error) {
    console.error('Error creating Jira tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Change the port to avoid the EADDRINUSE error
const PORT = process.env.PORT || 3005;

// Add error handling for the server
const server = app.listen(PORT, () => {
  console.log(`LangChain AI Project Management API running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

export default app;