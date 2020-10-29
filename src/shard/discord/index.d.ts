export type CmdOptions = {
    [key:string]: string;
}

export type ParsedCmd = {
    args: string[];
    options: CmdOptions;
    flags: string[]
}