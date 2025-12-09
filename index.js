import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import admin from "firebase-admin";
import fs from "fs";

// =====================
// Firebase Admin Setup
// =====================
// Save your Firebase service account JSON as firebaseConfig.json in project folder
const serviceAccount = JSON.parse(fs.readFileSync("./firebaseConfig.json"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bhai-rk-default-rtdb.firebaseio.com"
});
const db = admin.database();

// =====================
// Discord Bot Config
// =====================
const config = {

  verify_channel: "1430363087080263824",
  verified_role: "1430367552655065138"
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages]
});

// =====================
// Bot always offline
// =====================
client.on("ready", () => {
  client.user.setPresence({ status: "invisible" });
  console.log("Bot running in Offline Mode (Always Offline)");

  const channel = client.channels.cache.get(config.verify_channel);
  if (!channel) return console.log("Verify channel not found!");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("verify_btn")
      .setStyle(ButtonStyle.Success)
      .setLabel("✔ Click to Verify")
  );

  channel.send({
    content: "**Click the button to verify yourself**",
    components: [row]
  });
});

// =====================
// Button press → Firebase update + role assign + 1 sec online
// =====================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "verify_btn") {
    const verifiedRole = interaction.guild.roles.cache.get(config.verified_role);
    if (!verifiedRole) return interaction.reply({ content: "Verified role not found!", ephemeral: true });

    // Firebase write
    const ref = db.ref("verified/" + interaction.user.id);
    await ref.set({ verified: true, timestamp: Date.now() });

    // Assign role
    await interaction.member.roles.add(verifiedRole);

    await interaction.reply({ content: "🎉 Verified and saved to Firebase!", ephemeral: true });

    // Temporary online
    client.user.setPresence({ status: "online" });

    setTimeout(() => {
      client.user.setPresence({ status: "invisible" });
    }, 1000);
  }
});

client.login(config.token);
