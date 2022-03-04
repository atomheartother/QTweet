import fs from "fs";
import { Client } from "./clientType";

export default (client: Client) => {
    console.log("Loading command files...");

    const commandFiles = fs.readdirSync("../slashCommands", { withFileTypes: true }).filter(file => file.name.endsWith(".ts"));

    console.log("Loaded command files successfully!");
    console.log("Importing command files...");

    for (const commandFile of commandFiles) {
        let command = require("./slashCommands/" + commandFile.name);
        if (command.default) command = command.default;
        client.slashCommands.set(command.data.name, command);
    }

    console.log("Command files ready!");
};
