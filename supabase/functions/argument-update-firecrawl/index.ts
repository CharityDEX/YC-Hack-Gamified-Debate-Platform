// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import OpenAI from 'https://deno.land/x/openai@v4.24.0/mod.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function getClaims(transcript: string, openai: OpenAI) {
    const systemMessage = {
        role: 'system',
        content: `You are a helpful fact checker, debate moderator, and specificially a claim identifier. Consider the following transcript and identify the most important checkable argument claims made in the transcript, so they can be fact checked using a web search. Output your result as a list of claims separated by new lines. Only select actual fact-based claims, which could be fact checked with web search, Don't select personal or emotional claims. For example: select the claim that "joe biden was never president", but don't output an emotional/personal claim like "I love you" or an un-verifiable claim like "you never washed the dishes". Do NOT start the claims with letters, just output text!`
    };

    const userMessage = {
        role: 'user',
        content: `Consider the following transcript and identify the most important checkable argument claims made in the transcript, so they can be fact checked using a web search. Identify 0-5 claims. Output your result as a list of claims separated by new lines. Only select actual fact-based claims, which could be fact checked with web search, don't select personal or emotional claims that can't be verified with search! For example: select the claim that "joe biden was never president", but don't select the claim that "you never wash the dishes". Do NOT start the claims with letters, just output text! Here is the transcript: ${transcript} Main logical claims that can be fact-checked (separated by new lines):`
    };

    const chatCompletion = await openai.chat.completions.create({
        messages: [systemMessage],
        model: 'gpt-4o-mini',
        stream: false
    });

    const result = chatCompletion.choices[0].message.content.split('\n');
    return result;
    /*
    if (result == "0") {
        // no claims found
        const claims = ["0"];
    } else {
        const claims = result.split('\n');
    }
    return claims;*/
}

async function getSearchQueries(claims: string[], openai: OpenAI) {
    const systemMessage = {
        role: 'system',
        content: `You are a helpful debate moderator / fact checking query generator assistant. For each of the provided argument claims, please create a question query the answer to which would give useful results that could determine whether this claim is true or false. Please output your result as a list of question queries separated by new lines. Only output queries, don't output the original claims! Create one question per claim. Here are the claims: ${claims.join('\n')} Your question queries (separated by newlines):`
    };

    const chatCompletion = await openai.chat.completions.create({
        messages: [systemMessage],
        model: 'gpt-4o-mini',
        stream: false
    });

    const queries = chatCompletion.choices[0].message.content.split('\n');
    return queries;
}

async function getTavilyAnswers(queries: string[], tavily_link: string, tavily_key: string) {
    const fetchPromises = queries.map(query => {
        return fetch(`${tavily_link}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${tavily_key}`,
            },
            body: JSON.stringify({
                "query": query,
                "include_answer": true
            }),
        })
        .then(response => response.json())
        .then(data => data.answer);
    });
    const promise_results = await Promise.all(fetchPromises);
    return promise_results;
}

async function classifyClaim(claim: string, tavilyAnswer: string, openai: OpenAI) {
    const systemMessage = {
        role: 'system',
        content: `You are a fact-checking claim evaluation assistant. You will be provided with a users claim, and a credible piece of information yielded from a search agent. Using this information and potentially your general knowledge, please evaluate whether this claim is true or false. Please output only one number showing your answer. Output 0 if the claim is false, 1 if the claim is true, and 2 if you are unsure or if you do not have enough information to judge. Do not output anything else! Here is the claim you should fact check: ${claim} \n Here is the credible search-supported evaluation: ${tavilyAnswer} \n Your classification:`
    };

    const chatCompletion = await openai.chat.completions.create({
        messages: [systemMessage],
        // Choose model from here: https://platform.openai.com/docs/models
        model: 'gpt-4o-mini',
        stream: false
    })

    const reply = chatCompletion.choices[0].message.content
    return reply;
}

async function combineLists(list1: string[], list2: string[]): [string, string][] {
    if (list1.length !== list2.length) {
        throw new Error("Lists must be of the same size");
    }
    return list1.map((item, index) => [item, list2[index]]);
}

async function convertStringsToInts(strings: string[]): number[] {
    return strings.map((str) => {
        const parsed = parseInt(str, 10); // Use base 10 for parsing
        if (isNaN(parsed)) {
            throw new Error(`Invalid number: ${str}`);
        }
        return parsed;
    });
}

Deno.serve(async (req) => {

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const { audio, user_id, message_role } = await req.json();
    console.error(`RECIEVED AUDIO! ${audio}`);

    // Decode Base64 audio
    const audioBuffer = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioBuffer], { type: 'audio/m4a' });
    const audioFile = new File([audioBlob], 'recording.m4a', { type: 'audio/m4a' });

    // init openai
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const openai = new OpenAI({
        apiKey: openaiApiKey,
    })

    // Transcribe the audio using OpenAI Whisper
    const transcriptionResponse = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en"
    });

    const transcribed_message = transcriptionResponse.text;

    //const claim = "thomas edison did not invent the lightbulb. Also, donald trump is not even president!";
    
    const tavily_url = Deno.env.get('TAVILY_URL');
    const tavily_key = Deno.env.get('TAVILY_API_KEY');
   
    const detected_claims = await getClaims(transcribed_message, openai);
    console.error(`DETECTED CLAIMS ${detected_claims}`);
    /*
    if (detected_claims[0] == "0") {
        // no claims
        console.error(`NO CLAIMS!`);

        const response_data = { 
            "claims": [],
            "keywords": [],
            "score": 0,
            "logics": [],
            "noclaims": true
        }
    
        return new Response(JSON.stringify(response_data), {
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
            status: 200
        })
    } else {
        console.error(`DETECTED CLAIMS ${detected_claims}`);
    }*/
    

    const queries = await getSearchQueries(detected_claims, openai);
    console.error(`CREATED QUERIES ${queries}`);

    const tavily_answers = await getTavilyAnswers(queries, tavily_url, tavily_key);
    console.error(`GOT ANSWERS ${tavily_answers}`);

    const classification_promises = detected_claims.map((c, index) => classifyClaim(c, tavily_answers[index], openai));
    const classification_results = await Promise.all(classification_promises);
    console.error(`GOT CLASSIFIED! ${classification_results}`)

    // init supabase
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // write to table
    const fact_check = true;
    const message_content = transcribed_message;
    const { data, error } = await supabaseClient.from('messages').insert([{ user_id, message_role, message_content, fact_check } ])
    if (error) {
        console.error(`ERROR! ${JSON.stringify(error)}`);
    }

    //const { data, error } = await supabaseClient.from('messages').insert([{ test_id, test_role, test_message, fact_check }])
    //const { data, error } = await supabaseClient.from('users').insert([{ user_id, first_name, last_name } ])
    //const { data, error } = await supabaseClient.from('users').insert([{ user_id, first_name, last_name } ])

    // combine claims and factcheck for response
    const classification_integers = await convertStringsToInts(classification_results);
    const combined_data = await combineLists(classification_integers, detected_claims);

    const response_data = { 
        "claims": combined_data,
        "keywords": [],
        "score": 0,
        "logics": [],
        "noclaims": false
    }

    return new Response(JSON.stringify(response_data), {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        status: 200
    })
})
