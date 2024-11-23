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

async function getUnderstandTips(user: string, messages: any, openai: OpenAI) {
    const systemMessage = {
        role: 'system',
        content: `You are a helpful argument mediator assistant with a university ethics professor level of experience. Considering the following transcript of a debate or argument between two people, please provide a concise paragraph of tips for ${user} to help them understand their opponent better, helping them arrive at a mutual decision. Please generate a simple small paragrph of one to two sentences of plain text providing this advice for ${user}. Transcript:`
    };

    const fullMessages = [systemMessage, ...messages];

    // call openai
    // Documentation here: https://github.com/openai/openai-node
    const chatCompletion = await openai.chat.completions.create({
        messages: fullMessages,
        // Choose model from here: https://platform.openai.com/docs/models
        model: 'gpt-4o-mini',
        stream: false,
    })

    const reply = chatCompletion.choices[0].message.content;
    return reply;
}

async function getImprovementTips(user: string, messages: any, openai: OpenAI) {
    const systemMessage = {
        role: 'system',
        content: `You are a helpful argument mediator assistant with a university ethics professor level of experience. Considering the following transcript of a debate or argument between two people, please provide a concise paragraph of tips for ${user} to help them improve their argument and debate skills, helping them become a better debater in the future. Please generate a simple small paragrph of one to two sentences of plain text providing this advice for ${user}. Transcript:`
    };

    const fullMessages = [systemMessage, ...messages];

    // call openai
    // Documentation here: https://github.com/openai/openai-node
    const chatCompletion = await openai.chat.completions.create({
        messages: fullMessages,
        // Choose model from here: https://platform.openai.com/docs/models
        model: 'gpt-4o-mini',
        stream: false,
    })

    const reply = chatCompletion.choices[0].message.content;
    return reply;
}

Deno.serve(async (req) => {

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const body = await req.json();
    const { user_id, role1, role2 } = body;

    // init openai
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    const openai = new OpenAI({
        apiKey: apiKey,
    })

    // supabase client
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // query messages
    const { data, error } = await supabaseClient
        .from('messages')
        .select('message_role, message_content')
        .eq('user_id', user_id)
        .order('message_time', { ascending: true });

    if (error) {
        console.error('Error:', query_error.message);
    }

    // Map data to OpenAI's required format
    const messages = data.map((msg) => ({
        role: 'user',
        content: `${msg.message_role}: ${msg.message_content}`,
    }));
    /*
    const systemMessage = {
        role: 'system',
        content: 'You are an argument mediator assistant that summarizes the key points and takeaways from an argument, debate or conversation. Please consider the following argument, and output a quick summary, as well as some potential connection points or methods the users can use to understand each others point of view. Also provide advice to each of them to improve their argument skills.'
    };

    const fullMessages = [systemMessage, ...messages];
    */
    /*
    const chatCompletion = await openai.chat.completions.create({
        messages: fullMessages,
        model: 'gpt-4o-mini',
        stream: false,
    })
    */
    //const reply = chatCompletion.choices[0].message.content
    


    // delete message history
    /*
    const { del_data, del_error } = await supabase
      .from('messages')  // Specify your table name
      .delete()  // Delete operation
      .eq('user_id', user_id);  // Filter for the key and value
    */

    const understand_tips1 = await getUnderstandTips(role1, messages, openai);
    const understand_tips2 = await getUnderstandTips(role2, messages, openai);

    const improve_tips1 = await getImprovementTips(role1, messages, openai);
    const improve_tips2 = await getImprovementTips(role2, messages, openai);

    const response_data = {
        "understand1": understand_tips1,
        "understand2": understand_tips2,
        "penetrate1": improve_tips1,
        "penetrate2": improve_tips2
    }

    return new Response(JSON.stringify(response_data), {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        status: 200
    })
})