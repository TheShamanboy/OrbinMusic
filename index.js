require('dotenv').config(); 

const playdl = require('play-dl');;
const { search } = require('play-dl');
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const youtubeApiKey = process.env.YOUTUBE_API_KEY;
const prefix = process.env.PREFIX || '!'; 
const activity = {
  text: 'Music on discord',
  type: 'PLAYING',
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.musicPlayers = new Map();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  try {
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  } catch (error) {
    console.error(`[ERROR] Failed to load command at ${filePath}:`, error);
  }
}

console.log(`Loaded commands: ${[...client.commands.keys()].join(', ')}`);

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity(activity.text, { type: ActivityType[activity.type] });
  console.log(`Serving in ${client.guilds.cache.size} servers`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

// ** Message-based command handler **
client.on('messageCreate', async message => {
  console.log(`Received message: "${message.content}" from ${message.author.tag}`);

  if (message.author.bot) {
    console.log('Message is from a bot, ignoring.');
    return;
  }

  if (!message.content.startsWith(prefix)) {
    console.log(`Message does not start with prefix "${prefix}", ignoring.`);
    return;
  }

  console.log('Prefix detected, processing command...');

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName) || 
                  client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) {
    console.log(`Command not found: ${commandName}`);
    return;
  } else {
    console.log(`Found command: ${commandName}`);
  }

  if (typeof command.executeMessage !== 'function') {
    console.log(`Command "${commandName}" does NOT have executeMessage function.`);
    message.reply('This command does not support message-based execution.');
    return;
  }

  try {
    const context = {
      commandName,
      user: message.author,
      member: message.member,
      guild: message.guild,
      channel: message.channel,
      client,
      prefix,
      message,
      args,
      isSlashCommand: false,
      reply: async (options) => {
        if (typeof options === 'string') {
          return message.reply(options);
        } else {
          return message.reply(options);
        }
      }
    };

    await command.executeMessage(context);
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    message.reply('There was an error executing that command!');
  }
});

client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

client.login(process.env.DISCORD_TOKEN);
