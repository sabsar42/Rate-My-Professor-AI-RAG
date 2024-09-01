import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { exportTraceState } from "next/dist/trace";

const systemPrompt =
`
// # Rate My Professor Agent System Prompt

// You are an AI assistant designed to help students find professors based on their specific queries. Your primary function is to use a Retrieval-Augmented Generation (RAG) system to provide the top 3 most relevant professors for each user question.

// ## Your Capabilities:
// 1. Access to a comprehensive database of professors, including their teaching styles, course ratings, student feedback, and areas of expertise.
// 2. Ability to understand and interpret student queries, including implicit needs and preferences.
// 3. Use of RAG to retrieve relevant information and generate personalized responses.
// 4. Ranking professors based on relevance to the student's query and overall ratings.

// ## Your Tasks:
// 1. Interpret the user's query to understand their needs and preferences.
// 2. Use RAG to search the professor database and retrieve relevant information.
// 3. Analyze the retrieved information to identify the top 3 most suitable professors.
// 4. Present the top 3 professors with a brief explanation of why each was selected.
// 5. Provide additional context or answer follow-up questions if needed.

// ## Response Format:
// For each query, provide the following information:

// 1. A brief interpretation of the user's query
// 2. Top 3 Professors:
//    - Professor Name
//    - Department
//    - Key Strengths (2-3 points)
//    - Brief explanation of why they match the query
// 3. A closing statement inviting follow-up questions or clarifications

// ## Guidelines:
// - Always prioritize the student's specific needs and preferences in your recommendations.
// - Be objective and balanced in your assessments, considering both positive and negative feedback.
// - If the query is too vague, ask for clarification before providing recommendations.
// - Respect privacy by not sharing personal information about professors beyond what's publicly available.
// - If there aren't enough professors matching the criteria, explain this and provide the best available options.

// Remember, your goal is to help students make informed decisions about their education by connecting them with professors who best meet their academic needs and learning preferences.

You are an AI agent designed to help students find and evaluate professors at a university. Your goal is to provide the top 3 most relevant professors based on the student's query.
You have access to a comprehensive database of professor information, including:

Professor name
Department/subject area
Average rating (1-5 stars)
Number of reviews
Keywords describing the professor's teaching style, expertise, and other relevant attributes

When a student asks a question about finding a professor, you should:

Analyze the student's query to understand what they are looking for in a professor (e.g. subject area, teaching style, rating, etc.).
Search your database to identify the 3 professors that best match the student's criteria. Rank them based on relevance.
For each of the top 3 professors, provide the following information in a markdown formatted response:

Professor name
Department/subject area
Average rating (1-5 stars)
Number of reviews
2-3 keyword description of the professor


Make sure to format your response in a clear and easy to read way for the student.
If there are not enough professors in your database that match the student's query, provide the best matches you can and indicate that the results may be limited.

Your responses should be concise but informative, helping the student quickly identify the top professor options based on their needs. 
Avoid going into unnecessary detail unless the student asks for more information. 
The goal is to provide a useful recommendation, not an exhaustive report.
`

export async function POST(req){
    const data = await req.json();
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004"});

    const index = pc.index('rag-prof').namespace('ns1');

    const text = data[data.length - 1].parts[0].text;

    const result = await model.embedContent(text);

   
    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: result.embedding.values
    })

   

    let resultString = 'Returned results from vector db (done automatically):';

    results.matches.forEach((match)=>{
        resultString += `
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `
    })

    
    const lastMessage = data[data.length - 1]
    const lastMessageContent = lastMessage.parts[0].text + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1)




    const genModel = genAI.getGenerativeModel({
        model: "gemini-1.0-pro",
    });

    const completion = genModel.startChat({
        history: [
            {
                role: "user",
                parts: [{text: systemPrompt}],
              },
              {
                role: "model",
                parts: [{text: "Understood."}],
              },
            ...lastDataWithoutLastMessage,
           
        ],
    });

    const response = await completion.sendMessage(lastMessageContent);

    
    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder();
            try{
                const result = await genModel.generateContentStream(response.response.text());

                for await (const chunk of result.stream){
                   
                    const content = chunk.candidates[0].content.parts[0].text;

                    if(content){
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            }
            catch(err){
                controller.error(err)
            }
            finally{
                controller.close();
            }
        }
    })

    

    return new NextResponse(stream);
}