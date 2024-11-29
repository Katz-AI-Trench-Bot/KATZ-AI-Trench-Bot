import OpenAI from 'openai';
import { config } from '../config.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey
});

const systemPrompts = {
  memeCapital: `You are a meme capital investment advisor specializing in Web3 and crypto memes. 
Your task is to:
- Analyze meme trends and their potential value
- Provide specific insights about meme longevity
- Suggest potential investment opportunities
- Consider viral potential and market timing
Format your response in these sections:
1. Meme Analysis 📊
2. Viral Potential 🚀
3. Investment Strategy 💰
4. Risk Factors ⚠️
5. Recommendation ✨`,
  
  investment: `You are a Web3 investment advisor analyzing loan data and providing strategic advice. 
Focus on:
- Risk assessment
- Market timing
- Growth potential
- Technical analysis
Format your response in these sections:
1. Market Analysis 📊
2. Risk Assessment ⚠️
3. Growth Potential 📈
4. Strategy Recommendation 💡`,
  
  image: `You are an AI assistant analyzing images. 
Provide insights about:
- Content description
- Key elements
- Technical aspects
- Relevant context
Format your response clearly and concisely.`,
  
  pdf: `You are an AI assistant analyzing PDF documents.
Provide:
- Document summary
- Key points
- Important details
- Relevant insights
Format your response in a clear, structured way.`,
  
  chat: `You are Courage's Trench Bot, a friendly and knowledgeable AI assistant.
Provide helpful responses about:
- Crypto and Web3 topics
- Trading and investments
- Technical analysis
- Market trends
Keep responses clear, concise, and informative.
Format your response in a clear, structured way.`,
  
  general: "You are Courage's Trench Bot, focusing on Web3 investments and meme capital."
};

let isConnected = false;
let conversationHistory = new Map();

async function testConnection() {
  try {
    await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 5
    });
    isConnected = true;
    return true;
  } catch (error) {
    isConnected = false;
    error.name = 'OpenAIError';
    throw error;
  }
}

function clearConversation(userId) {
  conversationHistory.delete(userId);
}

async function generateAIResponse(input, purpose, userId = null) {
  try {
    if (!isConnected) {
      await testConnection();
    }

    // Get conversation history for this user
    let messages = [];
    if (userId) {
      messages = conversationHistory.get(userId) || [];
    }

    // Add system prompt and user input
    if (messages.length === 0) {
      messages.push({
        role: "system",
        content: systemPrompts[purpose] || systemPrompts.general
      });
    }

    // Handle different input types
    if (purpose === 'image') {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "What's in this image?" },
          { type: "image_url", image_url: input }
        ]
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: messages,
        max_tokens: 500
      });

      const reply = response.choices[0].message;
      messages.push(reply);

      if (userId) {
        conversationHistory.set(userId, messages);
      }

      return reply.content;
    }
    
    if (purpose === 'pdf') {
      messages.push({
        role: "user",
        content: input
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        max_tokens: 500
      });

      const reply = response.choices[0].message;
      messages.push(reply);

      if (userId) {
        conversationHistory.set(userId, messages);
      }

      return reply.content;
    }

    // Handle text conversations
    messages.push({
      role: "user",
      content: input
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const reply = response.choices[0].message;
    messages.push(reply);

    if (userId) {
      conversationHistory.set(userId, messages);
    }

    return reply.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    isConnected = false;
    error.name = 'OpenAIError';
    throw error;
  }
}

export { openai, generateAIResponse, testConnection, clearConversation };