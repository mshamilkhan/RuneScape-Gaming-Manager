import { OpenAI } from "openai";
import { Client, GatewayIntentBits } from "discord.js";
import { ChatGPT } from "discord-chat-gpt";
import { commands } from "./register_command.js";
// import { fs } from "fs";
import "dotenv/config";


// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------

// JSONS IMPORTS 

import diaryJSON from './jsons/diary.json' assert { type: "json" };
import ironJSON from './jsons/iron_pricing.json' assert { type: "json" };
import miscJSON from './jsons/misc_pricing.json' assert { type: "json" };
import skill1JSON from './jsons/skill_1.json' assert { type: "json" };
import skill2JSON from './jsons/skill_2.json' assert { type: "json" };
import skill3JSON from './jsons/skill_3.json' assert { type: "json" };
import experienceJSON from './jsons/experience.json' assert { type: "json" };
// let iron = JSON.stringify(ironJSON);
let misc = JSON.stringify(miscJSON);
let skill1 = JSON.stringify(skill1JSON);
let skill2 = JSON.stringify(skill2JSON);
let skill3 = JSON.stringify(skill3JSON);
// let diaryfs = fs.readFileSync(diaryJSON);
let diary = JSON.stringify(diaryJSON);
let experience = JSON.stringify(experienceJSON);
// let diaryjs = JSON.parse(diary);

let ironjs = JSON.stringify(ironJSON);


// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------

let response;
let history = "";


// console.log(diaryJSON)





const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,

    ],
    allowedMentions: {

        repliedUser: false,
    }
});

//OPEN AI API
const gptClient = new OpenAI({
    // apiKey: import.meta.env.OPENAI_API_KEY,
    apiKey: "xxxxx",
});


//STARTING THE BOT
client.on('ready', () => {
    console.log(`Logged in as ${client.user.username}!`);
});


// Define the conversation history array
let conversationHistory = [];
conversationHistory.push(
    {
        role: 'system',
        content: `"Your name is alexendra and you are AI quoting bot. You will help people to calculate their gaming notes and coins with their prices. You provide different services.
        Greet them politely. Line with # is an example question and line starts with - is an example answer.
        STEP 1: After greeting must ask them that are they regular player or in Ironman mode.
    "`},
    {
        role: 'system',
        content: ` " Point to remember: If someone ask for diary notes you should ask them few things:
        STEP 1: Which mode you are playing ironman mode or a regular.
        If a user say ironman mode then ask : 
        STEP 2 : You are playing ironman mode so Do you want any upcharge? 
        STEP 3 : Show him the upcharges 
        {
            "if upcharges required: "{
        ed = upcharges for easy diary = 0.8$
        md = upcharges for medium diary = 0.8$
        hd = upcharges for hard diary = 0.8$
        ed = upcharges for elite diary = 1.2$
            }
        }
        STEP 4: read the data from this JSON ${diary} and quote a price according to this user message ${history}. Each user can only buy 1 diary for its account. If he has multiple accounts then he can buy more. 
        STEP 5: If a user has'nt tell about the level difficulty (easy, medium, hard, elite) then ask him explicitly which diary note they want (easy,medium , hard, elite).
        EXAMPLE 1 :
        In json easy representing for regular clients note price and easy-iron-note is the price for ironman mode for the same thing
        # I want easy diary note for [x origin] where x is the name of places like desert, ardougne, varrok etc
        - for regular client : 'x' easy diary notes will cost you 'price'$
        - for ironman mode : 'x' easy diary note will cost you 'totalCost' = ('price' + upcharges)$
        - for ironman mode :'x' easy diary note will cost you 'totalCost' = (0.8 + 0.8)$ is 1.6$
        - for regular mode : 'x' easy diary note will cost you 2.4$
        EXAMPLE 2 :
        # I want easy diary note and falador elite note
        - for regular client : desert easy diary notes will cost you 'price1'$ and falador easy note is 'price2'$ 
        - for ironman mode : desert easy diary note will cost you Cost1 = ('price1' + upcharges)$ and falador is Cost2 = ('price2' + upcharges)$ and total charges are 'FinalCost' = Cost1 + Cost2

         "  `
    },
    {
        role: 'system',
        content: ` " Remeber: this content ${ironjs} is only for those who are in ironman mode.
        STEP 1: ask user How many 'content' you want. content may be ort myre fungus , runs, cannon balls etc.
        STEP 2: Multiply the 'number' of 'content' with its price unit.
        EXAMPLE:
          # I want 100 wines of zamorak
          - 100 wines of zamorak will cost you about hard wilderness diary 0.01$ , without diary: 0.016$
         # I want 'x' number of 'content'
         - 'x' 'content' will cost you about 'price'$ " `
    },
    {
        role: 'system',
        content: ` " if someone ask for skills then remember these steps:
        step 0: {ask them the variety of skill if it exists like attack has 3 varieties nmz, crabs and nmz-70 bases-no vpn}
        step 1: {Ask for the starting and ending level}
        step 2: {if a user mention the starting level 'x' and ending level 'y' then read this file ${experience}}
        step 3: {add all the experience difference from the starting level+1 till ending level}
        step 4: {if a user say from level 1 to 5 then calculate as: [lvl2 + lvl3 + lvl4 + lvl5] = [83 + 91 + 102 + 112]}
        step 5: {show the user total number of experience difference}
        step 6 { read this file ${skill1} to know the price per unit for each level}
        step 7: {multiply the price of each level with total experience difference}
        step 8 : {Show them the total cost}
        step 9: {Hard coded examples: {
            1# I want attack for level 1 to 5 for nmz
                - ask which variety of attack you want and show them sub sections of attack
                - the price for nmz attack will be 388 * 0.00012
        },
        Example 2: {
            # I want 'skill' from level 'x' to 'y'
                - sum of experience difference  from level 'x1' to 'y5' =x1 + x3 +x4 + x5 ='total_experience'
        }, 
        {
             # I want rs3 agility from level 1 to 4
                 - sum of experience difference  from level 1 to 4 = 83+91+102 = 276 
                   now the price of rs3 agility from level 1 to 4 is 0.00060 
                   multiply 276 * 0.00060 = 0.1656$
        }, {
             now the price of 'skill' from level 'x' to 'y' is 'price' 
                  multiply 'total_experience * 'price' = 'totalprice'$
        
        }
        }
           " `
    },
    {
        role: "system",
        content: `" if someone ask for skills then remember these steps:
        step 0: {ask them the variety of skill if it exists like attack has 3 varieties nmz, crabs and nmz-70 bases-no vpn}
        step 1: {Ask for the starting and ending level}
        step 2: {if a user mention the starting level 'x' and ending level 'y' then read the previous experience file}
        step 3: {add all the experience difference from the starting level+1 till ending level}
        step 4: {if a user say from level 1 to 5 then calculate as: [lvl2 + lvl3 + lvl4 + lvl5] = [83 + 91 + 102 + 112]}
        step 5: {show the user total number of experience difference}
        step 6 { read this file ${skill2} to know the price per unit for each level}
        step 7: {multiply the price of each level with total experience difference}
        step 8 : {Show them the total cost}
        step 9: {Hard coded examples: {
            1# I want rs3 magic for level 1 to 5 for nmz
                - ask which variety of attack you want and show them sub sections of attack
                - the price for nmz attack will be 388 * 0.000160
        },
        Example 2: {
            # I want 'skill' from level 'x' to 'y'
                - sum of experience difference  from level 'x1' to 'y5' =x1 + x3 +x4 + x5 ='total_experience'
        }, 
        {
             # I want magic stun alching from level 1 to 4
                 - sum of experience difference  from level 1 to 4 = 83+91+102 = 276 
                   now the price of rs3 agility from level 1 to 4 is 0.000018
                   multiply 276 * 0.000018 = 0.004968$
        }, {
             now the price of 'skill' from level 'x' to 'y' is 'price' 
                  multiply 'total_experience * 'price' = 'totalprice'$
        
        }
        }
           "`
    },
    {
        role: "system",
        content: `" if someone ask for skills then remember these steps:
        step 0: {ask them the variety of skill if it exists like attack has 3 varieties nmz, crabs and nmz-70 bases-no vpn}
        step 1: {Ask for the starting and ending level}
        step 2: {if a user mention the starting level 'x' and ending level 'y' then read the previous experience file}
        step 3: {add all the experience difference from the starting level+1 till ending level}
        step 4: {if a user say from level 1 to 5 then calculate as: [lvl2 + lvl3 + lvl4 + lvl5] = [83 + 91 + 102 + 112]}
        step 5: {show the user total number of experience difference}
        step 6 { read this file ${skill3} to know the price per unit for each level and show the user per unit price os skill he want}
        step 7: {multiply the price of each level with total experience difference}
        step 8 : {Show them the total cost}
        step 9: {Hard coded examples: {
            1# I want mining for level 1 to 5 for nmz
                - ask which variety of attack you want and show them sub sections of attack
                - the price for nmz attack will be 388 * 0.000700
        },
        Example 2: {
            # I want 'skill' from level 'x' to 'y'
                - sum of experience difference  from level 'x1' to 'y5' =x1 + x3 +x4 + x5 ='total_experience'
        }, 
        {
             # I want draon bones from level 1 to 4
                 - sum of experience difference  from level 1 to 4 = 83+91+102 = 276 
                   now the price of rs3 agility from level 1 to 4 is 0.000040
                   multiply 276 * 0.000040 = 0.01104$
        }, {
             now the price of 'skill' from level 'x' to 'y' is 'price' 
                  multiply 'total_experience * 'price' = 'totalprice'$
        
        }
        }
           "`
    },
    {
        role: "system",
        content: `" Remeber: whenever someone ask for misc read this file ${misc} 
        STEP 1: ask user How many 'misc_content' you want. content may be herbsack , full infinity, zeah, lovakengj etc.
        STEP 2: Multiply the 'number' of 'misc_content' with its price unit.
        EXAMPLE:
          # I want 100 lovakengj
          - 100 lovakengj will cost you about 8 * 100 = 800$ Requires 42 Mining, Started Plague City or 10 slayer
         # I want 'x' number of 'misc_content'
         - 'x' 'misc_content' will cost you about [x *'price']$ "`
    }
)




//HANDLING THE BOT
let input;
async function runCompletion(message) {




    // Add the user's message to the conversation history
    conversationHistory.push({ role: 'user', content: message });

    history = message;
    // console.log("C->HISTORY : ", conversationHistory)

    try {
        const completion = await gptClient.chat.completions.create({
            // model: "gpt-3.5-turbo",
            model: "gpt-3.5-turbo-16k",
            messages: conversationHistory,
            max_tokens: 500,
        });

        // Extract the assistant's reply from the completion
        response = completion.choices[0].message.content;
        console.log("DICTIONARY: ", message);
        // Send the assistant's reply to the channel
        // const msg = await message.reply(response);
    } catch (error) {
        console.error('Error sending message to the assistant:', error);
    }
};


// Event handler for incoming messages
client.on("messageCreate", async function handleMessage(message) {
    if (!message.guild || message.author.bot) return;
    const channel = message.guild.channels.cache.get("xxx");
    // client.on('typing', (channel) => {
    //     // Send a message to the channel indicating that the user is typing.
    //     channel.send('Typing...');
    // });

    // console.log(diary)
    // const channels = message.channel;
    // channels.startTyping();


    if (!channel) return;
    if (message.channel.id === channel.id) {
        console.log(message.author.username);
        const input = message.content;

        // Send the user's message to the assistant
        await runCompletion(input);
        // Extract the assistant's reply from the completion
        //   response = completion.choices[0].message.content;

        // Send the assistant's reply to the channel
        // const msg = await message.reply(response);
        let msg = await message.reply({
            content: ` ${response}`,
            // content: ` TESTING STARTED`,
        });
        conversationHistory.push({ role: 'system', content: response });
    }
});


//SLASH COMMANDS INTERACTIONS
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'close') {
        await interaction.reply('Your Chat ticket is closed');
        conversationHistory = [];
        conversationHistory.push(
            {
                role: 'system',
                content: `"Your name is alexendra and you are AI quoting bot. You will help people to calculate their gaming notes and coins with their prices. You provide different services.
                Greet them politely. Line with # is an example question and line starts with - is an example answer.
                STEP 1: After greeting must ask them that are they regular player or in Ironman mode.
            "`},
            {
                role: 'system',
                content: ` " Point to remember: If someone ask for diary notes you should ask them few things:
                STEP 1: Which mode you are playing ironman mode or a regular.
                If a user say ironman mode then ask : 
                STEP 2 : You are playing ironman mode so Do you want any upcharge? 
                STEP 3 : Show him the upcharges 
                {
                    "if upcharges required: "{
                ed = upcharges for easy diary = 0.8$
                md = upcharges for medium diary = 0.8$
                hd = upcharges for hard diary = 0.8$
                ed = upcharges for elite diary = 1.2$
                    }
                }
                STEP 4: read the data from this JSON ${diary} and quote a price according to this user message ${history}. Each user can only buy 1 diary for its account. If he has multiple accounts then he can buy more. 
                STEP 5: If a user has'nt tell about the level difficulty (easy, medium, hard, elite) then ask him explicitly which diary note they want (easy,medium , hard, elite).
                EXAMPLE 1 :
                In json easy representing for regular clients note price and easy-iron-note is the price for ironman mode for the same thing
                # I want easy diary note for [x origin] where x is the name of places like desert, ardougne, varrok etc
                - for regular client : 'x' easy diary notes will cost you 'price'$
                - for ironman mode : 'x' easy diary note will cost you 'totalCost' = ('price' + upcharges)$
                - for ironman mode :'x' easy diary note will cost you 'totalCost' = (0.8 + 0.8)$ is 1.6$
                - for regular mode : 'x' easy diary note will cost you 2.4$
                EXAMPLE 2 :
                # I want easy diary note and falador elite note
                - for regular client : desert easy diary notes will cost you 'price1'$ and falador easy note is 'price2'$ 
                - for ironman mode : desert easy diary note will cost you Cost1 = ('price1' + upcharges)$ and falador is Cost2 = ('price2' + upcharges)$ and total charges are 'FinalCost' = Cost1 + Cost2
        
                 "  `
            },
            {
                role: 'system',
                content: ` " Remeber: this content ${ironjs} is only for those who are in ironman mode.
                STEP 1: ask user How many 'content' you want. content may be ort myre fungus , runs, cannon balls etc.
                STEP 2: Multiply the 'number' of 'content' with its price unit.
                EXAMPLE:
                  # I want 100 wines of zamorak
                  - 100 wines of zamorak will cost you about hard wilderness diary 0.01$ , without diary: 0.016$
                 # I want 'x' number of 'content'
                 - 'x' 'content' will cost you about 'price'$ " `
            },
            {
                role: 'system',
                content: ` " if someone ask for skills then remember these steps:
                step 0: {ask them the variety of skill if it exists like attack has 3 varieties nmz, crabs and nmz-70 bases-no vpn}
                step 1: {Ask for the starting and ending level}
                step 2: {if a user mention the starting level 'x' and ending level 'y' then read this file ${experience}}
                step 3: {add all the experience difference from the starting level+1 till ending level}
                step 4: {if a user say from level 1 to 5 then calculate as: [lvl2 + lvl3 + lvl4 + lvl5] = [83 + 91 + 102 + 112]}
                step 5: {show the user total number of experience difference}
                step 6 { read this file ${skill1} to know the price per unit for each level}
                step 7: {multiply the price of each level with total experience difference}
                step 8 : {Show them the total cost}
                step 9: {Hard coded examples: {
                    1# I want attack for level 1 to 5 for nmz
                        - ask which variety of attack you want and show them sub sections of attack
                        - the price for nmz attack will be 388 * 0.00012
                },
                Example 2: {
                    # I want 'skill' from level 'x' to 'y'
                        - sum of experience difference  from level 'x1' to 'y5' =x1 + x3 +x4 + x5 ='total_experience'
                }, 
                {
                     # I want rs3 agility from level 1 to 4
                         - sum of experience difference  from level 1 to 4 = 83+91+102 = 276 
                           now the price of rs3 agility from level 1 to 4 is 0.00060 
                           multiply 276 * 0.00060 = 0.1656$
                }, {
                     now the price of 'skill' from level 'x' to 'y' is 'price' 
                          multiply 'total_experience * 'price' = 'totalprice'$
                
                }
                }
                   " `
            },
            {
                role: "system",
                content: `" if someone ask for skills then remember these steps:
                step 0: {ask them the variety of skill if it exists like attack has 3 varieties nmz, crabs and nmz-70 bases-no vpn}
                step 1: {Ask for the starting and ending level}
                step 2: {if a user mention the starting level 'x' and ending level 'y' then read the previous experience file}
                step 3: {add all the experience difference from the starting level+1 till ending level}
                step 4: {if a user say from level 1 to 5 then calculate as: [lvl2 + lvl3 + lvl4 + lvl5] = [83 + 91 + 102 + 112]}
                step 5: {show the user total number of experience difference}
                step 6 { read this file ${skill2} to know the price per unit for each level}
                step 7: {multiply the price of each level with total experience difference}
                step 8 : {Show them the total cost}
                step 9: {Hard coded examples: {
                    1# I want rs3 magic for level 1 to 5 for nmz
                        - ask which variety of attack you want and show them sub sections of attack
                        - the price for nmz attack will be 388 * 0.000160
                },
                Example 2: {
                    # I want 'skill' from level 'x' to 'y'
                        - sum of experience difference  from level 'x1' to 'y5' =x1 + x3 +x4 + x5 ='total_experience'
                }, 
                {
                     # I want magic stun alching from level 1 to 4
                         - sum of experience difference  from level 1 to 4 = 83+91+102 = 276 
                           now the price of rs3 agility from level 1 to 4 is 0.000018
                           multiply 276 * 0.000018 = 0.004968$
                }, {
                     now the price of 'skill' from level 'x' to 'y' is 'price' 
                          multiply 'total_experience * 'price' = 'totalprice'$
                
                }
                }
                   "`
            },
            {
                role: "system",
                content: `" if someone ask for skills then remember these steps:
                step 0: {ask them the variety of skill if it exists like attack has 3 varieties nmz, crabs and nmz-70 bases-no vpn}
                step 1: {Ask for the starting and ending level}
                step 2: {if a user mention the starting level 'x' and ending level 'y' then read the previous experience file}
                step 3: {add all the experience difference from the starting level+1 till ending level}
                step 4: {if a user say from level 1 to 5 then calculate as: [lvl2 + lvl3 + lvl4 + lvl5] = [83 + 91 + 102 + 112]}
                step 5: {show the user total number of experience difference}
                step 6 { read this file ${skill3} to know the price per unit for each level and show the user per unit price os skill he want}
                step 7: {multiply the price of each level with total experience difference}
                step 8 : {Show them the total cost}
                step 9: {Hard coded examples: {
                    1# I want mining for level 1 to 5 for nmz
                        - ask which variety of attack you want and show them sub sections of attack
                        - the price for nmz attack will be 388 * 0.000700
                },
                Example 2: {
                    # I want 'skill' from level 'x' to 'y'
                        - sum of experience difference  from level 'x1' to 'y5' =x1 + x3 +x4 + x5 ='total_experience'
                }, 
                {
                     # I want draon bones from level 1 to 4
                         - sum of experience difference  from level 1 to 4 = 83+91+102 = 276 
                           now the price of rs3 agility from level 1 to 4 is 0.000040
                           multiply 276 * 0.000040 = 0.01104$
                }, {
                     now the price of 'skill' from level 'x' to 'y' is 'price' 
                          multiply 'total_experience * 'price' = 'totalprice'$
                
                }
                }
                   "`
            },
            {
                role: "system",
                content: `" Remeber: whenever someone ask for misc read this file ${misc} 
                STEP 1: ask user How many 'misc_content' you want. content may be herbsack , full infinity, zeah, lovakengj etc.
                STEP 2: Multiply the 'number' of 'misc_content' with its price unit.
                EXAMPLE:
                  # I want 100 lovakengj
                  - 100 lovakengj will cost you about 8 * 100 = 800$ Requires 42 Mining, Started Plague City or 10 slayer
                 # I want 'x' number of 'misc_content'
                 - 'x' 'misc_content' will cost you about [x *'price']$ "`
            }
        )
    }
});




//LOGINTO THE BOT
// client.login(import.meta.env.BOT_TOKEN);
client.login("xxx");
