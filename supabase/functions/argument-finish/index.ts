// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import OpenAI from 'https://deno.land/x/openai@v4.24.0/mod.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {

    const body = await req.json();
    const { user_id } = body;

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

    const systemMessage = {
        role: 'system',
        content: 'You are an argument mediator assistant that summarizes the key points and takeaways from an argument, debate or conversation. Please consider the following argument, and output a quick summary, as well as some potential connection points or methods the users can use to understand each others point of view. Also provide advice to each of them to improve their argument skills.'
    };

    const fullMessages = [systemMessage, ...messages];

    // call openai
    // Documentation here: https://github.com/openai/openai-node
    const chatCompletion = await openai.chat.completions.create({
        messages: fullMessages,
        // Choose model from here: https://platform.openai.com/docs/models
        model: 'gpt-3.5-turbo',
        stream: false,
    })

    const reply = chatCompletion.choices[0].message.content

    // delete message history
    /*
    const { del_data, del_error } = await supabase
      .from('messages')  // Specify your table name
      .delete()  // Delete operation
      .eq('user_id', user_id);  // Filter for the key and value
    */

    const response_data = {
        message: reply,
    }

    return new Response(
        JSON.stringify(response_data),
        { headers: { "Content-Type": "application/json" } },
    )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/argument-finish' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
