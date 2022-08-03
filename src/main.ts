import axios from "axios";
import {
    ApplicationCommandOptionType,
    Client,
    REST,
    Routes,
    SlashCommandBuilder,
} from "discord.js";
import { parse } from "node-html-parser";
import Comic from "./types/comic";
//load variables from .env
require("dotenv").config();

const client = new Client({
    intents: [],
});

const stats = {
    randomRequests: 0,
    idRequests: 0,
    keywordRequests: 0,
    startupTime: new Date(),
};

//Log to console when bot is ready to recieve commands.
client.once("ready", () => {
    console.log("Ready");
});
const Comics: Comic[] = [];

//Setup even handler for the slash commands being used
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === "xkcd") {
        //no options provded, output random comic
        stats.randomRequests++;
        if (interaction.options.data.length === 0) {
            let request = Math.floor(Math.random() * Comics.length);
            //if the comic is not loaded, load it
            if (Comics[request].img === null) {
                let result = await axios.get<Comic>(
                    `https://xkcd.com/${request}/info.0.json`
                );
                Comics[request] = new Comic(result.data);
            }
            //send comic
            interaction.reply({ embeds: [Comics[request].toEmbed()] });
            return;
        }
        //integer option was provdided, attempt to display the comic with that id
        if (
            interaction.options.data[0].type ===
            ApplicationCommandOptionType.Integer
        ) {
            stats.idRequests++;
            const request: number = +(interaction.options.data[0].value || 0);
            //check if comic exists
            if (Comics[request]) {
                //if the comic is not loaded, load it
                if (Comics[request].img === null) {
                    let result = await axios.get<Comic>(
                        `https://xkcd.com/${request}/info.0.json`
                    );
                    Comics[request] = new Comic(result.data);
                }
                //send comic
                interaction.reply({ embeds: [Comics[request].toEmbed()] });
            } else {
                interaction.reply(
                    "I couldn't find that comic are you sure it's a valid id?"
                );
            }
        } else if (
            interaction.options.data[0].type ===
            ApplicationCommandOptionType.String
        ) {
            stats.keywordRequests++;
            const searchTerms = interaction.options.data[0].value as string;
            let matches = [];

            for (let i = 0; matches.length < 3 && i < Comics.length; i++) {
                if (Comics[i].title.match(new RegExp(searchTerms, "i"))) {
                    if (Comics[i].img === null) {
                        let result = await axios.get<Comic>(
                            `https://xkcd.com/${Comics[i].num}/info.0.json`
                        );
                        Comics[i] = new Comic(result.data);
                    }
                    matches.push(Comics[i]);
                }
            }

            interaction.reply({ embeds: matches.map((o) => o.toEmbed()) });
        }
    } else if (commandName === "stats") {
        const uptime = formatDuration(
            new Date().getTime() - stats.startupTime.getTime()
        );
        let output = `Known Comics: ${Comics.length}\n`;
        output += `Comics stored in RAM: ${
            Comics.filter((c) => c.img !== null).length
        }\n`;
        output += `Requests for comics (since last startup): ${
            stats.idRequests + stats.keywordRequests + stats.randomRequests
        }`;
        output += `Requests for random comics (since last startup): ${stats.randomRequests}\n`;
        output += `Requests for specific comics (since last startup): ${stats.idRequests}\n`;
        output += `Keyword searches for comics (since last startup): ${stats.keywordRequests}\n`;
        output += `Uptime: ${uptime}\n`;

        interaction.reply(output);
    }
});

function formatDuration(duration: number): string {
    let output = "";
    if (duration >= 2592000) {
        //month
        output += Math.floor(duration / 2592000).toString() + " Months ";
        duration = duration % 2592000;
    }
    if (duration >= 86400) {
        //day
        output += Math.floor(duration / 86400).toString() + " Days ";
        duration = duration % 86400;
    }
    if (duration >= 3600) {
        //hour
        output += Math.floor(duration / 3600).toString() + " Hours ";
        duration = duration % 3600;
    }
    if (duration >= 60) {
        //minute
        output += Math.floor(duration / 60).toString() + " Minutes ";
        duration = duration % 60;
    }
    output += duration + " Seconds";
    return output;
}

const commands = [
    new SlashCommandBuilder()
        .setName("xkcd")
        .setDescription("Replies with an xkcd comic.")
        .addIntegerOption((option) =>
            option
                .setName("id")
                .setDescription("The ID of the comic you want.")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("term")
                .setDescription("The term you want to search with")
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Show some stats about the bot."),
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

//Load titles for keyword search

axios
    .get("https://xkcd.com/archive/")
    .then((result) => {
        let id, name;
        const doc = parse(result.data);
        doc.querySelector("#middleContainer")
            ?.querySelectorAll("a")
            .forEach((ele, i) => {
                let name: string = ele.innerText.trim();
                let id: number = parseInt(
                    ele.attributes["href"].replace(/\//gi, "")
                );
                Comics.push(new Comic({ num: id, title: name }));
            });
    })
    .catch((e) => console.error);

function exitHandler(options: any, code: number) {}

setInterval(async () => {
    //fetch latest comic https://xkcd.com/info.0.json
    let result = await axios.get<Comic>(`https://xkcd.com/info.0.json`);
    Comics.push(new Comic(result.data));
}, 24 * 60 * 60 * 1000); //Run daily

//do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));
