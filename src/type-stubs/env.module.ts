/*
    This uses declaration merging to make the required properties avaialbe under
    process.env and ensure that they are typed correctly.
    
    https://www.typescriptlang.org/docs/handbook/declaration-merging.html
*/
namespace NodeJS {
    export interface ProcessEnv {
        DISCORD_BOT_TOKEN: string;
        DISCORD_OAUTH_CLIENT_ID: string;
    }
}
