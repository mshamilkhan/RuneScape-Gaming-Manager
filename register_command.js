// const { REST, Routes } = require("discord.js")
import { REST, Routes } from "discord.js";
import "dotenv/config";

const commands = [
    {
        name: 'close',
        description: 'close your chat ticket',
    }
];

const rest = new REST({ version: '10' }).setToken("MTEzOTk2MDkyNzk1ODA3MzM1NA.Gi0kdH.Ez4FBrWZgYUMhAWPL-4TxK8D3efMHDBlfJ0lyk");

try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands("1139960927958073354"), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}
export { commands };