const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { prefix, embedColor } = require('../config');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands'),
    
    // For slash commands
    async execute(interaction, client) {
        // Create an embed for the help message
        const embed = new EmbedBuilder()
            .setTitle('Music Bot Commands')
            .setColor(embedColor)
            .setDescription(`Here are all the available commands.\nYou can use either slash commands (/command) or prefix commands (${prefix}command).`);
        
        // Get all the command files to generate help
        const commandsPath = path.join(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        // Group commands by category
        const categories = {
            'Music': ['play', 'pause', 'resume', 'skip', 'stop', 'nowplaying', 'queue'],
            'Playlist Management': ['playlist'],
            'General': ['help']
        };
        
        for (const [category, commandNames] of Object.entries(categories)) {
            let categoryDescription = '';
            
            for (const name of commandNames) {
                // Find the command file
                const commandFile = commandFiles.find(file => file.startsWith(name));
                
                if (commandFile) {
                    const command = require(`./${commandFile}`);
                    
                    // Add slash command info
                    categoryDescription += `**/${command.data.name}**`;
                    if (command.data.description) {
                        categoryDescription += `: ${command.data.description}`;
                    }
                    categoryDescription += '\n';
                    
                    // Add prefix command aliases if they exist
                    if (command.aliases && command.aliases.length > 0) {
                        const aliasesStr = command.aliases.map(a => `${prefix}${a}`).join(', ');
                        categoryDescription += `Aliases: ${prefix}${command.data.name}, ${aliasesStr}\n`;
                    } else {
                        categoryDescription += `Aliases: ${prefix}${command.data.name}\n`;
                    }
                    
                    // Add spacing between commands
                    categoryDescription += '\n';
                }
            }
            
            if (categoryDescription) {
                embed.addFields([
                    { name: category, value: categoryDescription }
                ]);
            }
        }
        
        // Add footer
        embed.setFooter({ text: 'Use /help or +help to see this message again.' });
        
        return interaction.reply({ embeds: [embed] });
    },
    
    // For prefix commands
    async executeMessage(context) {
        // Create an embed for the help message
        const embed = new EmbedBuilder()
            .setTitle('Music Bot Commands')
            .setColor(embedColor)
            .setDescription(`Here are all the available commands.\nYou can use either slash commands (/command) or prefix commands (${prefix}command).`);
        
        // Get all the command files to generate help
        const commandsPath = path.join(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        // Group commands by category
        const categories = {
            'Music': ['play', 'pause', 'resume', 'skip', 'stop', 'nowplaying', 'queue'],
            'Playlist Management': ['playlist'],
            'General': ['help']
        };
        
        for (const [category, commandNames] of Object.entries(categories)) {
            let categoryDescription = '';
            
            for (const name of commandNames) {
                // Find the command file
                const commandFile = commandFiles.find(file => file.startsWith(name));
                
                if (commandFile) {
                    const command = require(`./${commandFile}`);
                    
                    // Add slash command info
                    categoryDescription += `**/${command.data.name}**`;
                    if (command.data.description) {
                        categoryDescription += `: ${command.data.description}`;
                    }
                    categoryDescription += '\n';
                    
                    // Add prefix command aliases if they exist
                    if (command.aliases && command.aliases.length > 0) {
                        const aliasesStr = command.aliases.map(a => `${prefix}${a}`).join(', ');
                        categoryDescription += `Aliases: ${prefix}${command.data.name}, ${aliasesStr}\n`;
                    } else {
                        categoryDescription += `Aliases: ${prefix}${command.data.name}\n`;
                    }
                    
                    // Add spacing between commands
                    categoryDescription += '\n';
                }
            }
            
            if (categoryDescription) {
                embed.addFields([
                    { name: category, value: categoryDescription }
                ]);
            }
        }
        
        // Add footer
        embed.setFooter({ text: 'Use /help or +help to see this message again.' });
        
        return context.reply({ embeds: [embed] });
    },
    
    // Command aliases for prefix commands
    aliases: ['h', 'commands', 'cmd']
};
