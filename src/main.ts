import axios, { AxiosError } from "axios";
import { Client, REST, Routes, SlashCommandBuilder } from "discord.js";
import Comic from "./types/comic";
//load variables from .env
require("dotenv").config();

const client = new Client({
    intents: [],
});

//Log to console when bot is ready to recieve commands.
client.once("ready", () => {
    console.log("Ready");
});

//Setup even handler for the slash commands being used
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === "xkcd") {
        if (interaction.options.data.length > 0) {
            //Load data from the JSON API build an embed for it
            axios
                .get<Comic>(
                    `https://xkcd.com/${interaction.options.data[0].value}/info.0.json`
                )
                .then((res) => {
                    interaction.reply(new Comic(res.data).toEmbed());
                })
                .catch((e: AxiosError) => {
                    console.error(e);
                    if (e.message.includes("404"))
                        interaction.reply(
                            "I can't find that comic, did you use a valid comic ID?"
                        );
                    else
                        interaction.reply(
                            "There was an error loading that comic, it has been logged for further investigation."
                        );
                    //console.error(e.response.status);
                });
        } else {
            //Request the random page and read back the URL after the redirect to the comic.
            axios.get("https://c.xkcd.com/random/comic/").then((res) => {
                //The path shuold look like `/208/` so grab only the number portion
                let id: string = res.request.path.replace(/[^\d]/gi, "");
                //Get the comic data from the API, same as above.
                axios
                    .get<Comic>(`https://xkcd.com/${id}/info.0.json`)
                    .then((res) => {
                        interaction.reply(new Comic(res.data).toEmbed());
                    })
                    .catch((e: AxiosError) => {
                        console.error(e);
                        if (e.message.includes("404"))
                            interaction.reply(
                                "I can't find that comic, did you use a valid comic ID?"
                            );
                        else
                            interaction.reply(
                                "There was an error loading that comic, it has been logged for further investigation."
                            );
                        //console.error(e.response.status);
                    });
            });
        }
    }
});

const commands = [
    new SlashCommandBuilder()
        .setName("xkcd")
        .setDescription("Replies with a random XKCD comic.")
        .addIntegerOption((option) =>
            option
                .setName("id")
                .setDescription("The ID of the comic you want.")
                .setRequired(false)
        ),
].map((command) => command.toJSON());

//Setup the REST API to push our commands list to it
const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_BOT_TOKEN
);

//PUT the commands list on the API, application wide
rest.put(Routes.applicationCommands(process.env.DISCORD_OAUTH_CLIENT_ID), {
    body: commands,
})
    .then(() => console.log("Registered Commands"))
    .catch(console.error);

//Connect the bot
client.login(process.env.DISCORD_BOT_TOKEN);
