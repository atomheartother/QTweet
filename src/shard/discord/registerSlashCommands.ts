import { Routes } from "discord-api-types/v9";
import { REST } from "@discordjs/rest";
import { Client } from "./clientType";

export default (client: Client) => {
    const commands = [...client.slashCommands.values()].map((command: any) => command.data.toJSON());
    console.log(commands);
    console.log("Registering slash commands...");
    const rest = new REST({ version: "9" }).setToken(process.env.TOKEN!);
    rest.put(Routes.applicationGuildCommands(client.application!.id, "928066059620196412"), { body: commands }).then(() => {
        console.log("Registered slash commands successfully!");
    });
};
