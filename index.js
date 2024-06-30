const {
    Client, 
    Events, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    IntentsBitField, 
    ButtonBuilder, 
    ButtonStyle, 
    ActionRowBuilder, 
    ComponentType,
    Component,
    MessageCollector
} = require('discord.js');

const {token} = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ],
});

client.on('ready', async (c) => {
    console.log(`${c.user.tag} has successfully connected!`);
    client.user.setActivity("Currently working!");
});

client.on('messageCreate', async msg => {
    if (msg.author.bot) return;

    if (msg.content.toLowerCase() !== 'ping') return;

    const firstButton = new ButtonBuilder()
        .setLabel('Guess the Number')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('guess-the-number')

    const secondButton = new ButtonBuilder()
        .setLabel('Blackjack')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId('black-jack')
        // cooldown: 10;

    const hitButton = new ButtonBuilder()
        .setLabel('Hit')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('hit')
    
    const standButton = new ButtonBuilder() 
        .setLabel('Stand')
        .setStyle(ButtonStyle.Danger)
        .setCustomId('stand')


    const buttonRow = new ActionRowBuilder().addComponents(firstButton, secondButton);

    const reply = await msg.reply( {content: 'Choose a game...', components: [buttonRow]});

    const filter = (i) => i.user.id === msg.author.id;

    const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter,
        time: 60000,
        
    });

    collector.on('collect', async (interaction) => {
        if (interaction.customId === 'guess-the-number') {
            const answer = Math.floor(Math.random() * 100) + 1;
            let results = false;
            await interaction.reply('You have 10 seconds to guess a number between 1 and 100 starting now');

            const messageFilter = response => !isNaN(response.content) && response.author.id === interaction.user.id;                
            const second_collector = interaction.channel.createMessageCollector({filter: messageFilter, time: 10000});

            second_collector.on('collect', async guess => {
                const guessedNumber = parseInt(guess.content);
                
                if (guessedNumber === answer) {
                    results = true;
                    await guess.reply(`Correct! You guessed the right number: ${answer}`);
                    second_collector.stop();
                    return;
                }
                else if (guessedNumber < 0 || guessedNumber > 100) {
                    await guess.reply('Out of bounds! (1-100)');
                }
                else if (guessedNumber < answer) {
                    await guess.reply('Higher!');
                } 
                else {
                    await guess.reply('Lower!');
                }
            })

            second_collector.on('end', () => {
                if (results === false) {
                    msg.channel.send(`Time is up. You lose! The correct number was ${answer}`);                    
                }
                else {
                    msg.channel.send(`Congratulations! You win!`);
                }
            })
        }
        
        if (interaction.customId === 'black-jack') {
            const deck = makeDeck();
            let playerHand = [hit(deck), hit(deck)];
            let dealerHand = [hit(deck), hit(deck)];
            for (let i = 0; i < deck.length; i++) {
                console.log(deck[i]);
            }
            await interaction.reply(`Your hand: 
                ${convertToString(playerHand)}`);
        }
    })

    collector.on('end', () => {
        firstButton.setDisabled(true);
        secondButton.setDisabled(true);

        reply.edit({
            content: 'Please re-run the command',
            components: [buttonRow],
        })
    })

    function makeDeck() {
        msg.channel.send('Beginning to create and shuffle the deck...');
        const suits = ['Hearts', 'Diamonds', 'Spades', 'Clubs'];
        const numbers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let deck = [];
    
        for (const suit in suits) {
            for (const num in numbers) {
                deck.push({num, suit});
            }
        }
        return deck;
    }
    
    function hit(deck) {
        
        return deck.pop();
    }
    
    function convertToString(hand) {
        return `${hand[0].num} of ${hand[0].suit}
                ${hand[1].num} of ${hand[1].suit}`;
    }
});

client.login(token);
