import { OLLAMA_CONFIG } from './config.js';
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://iwiorzjughvsvvfjdodw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aW9yemp1Z2h2c3Z2Zmpkb2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTkwNTMsImV4cCI6MjA3MjMzNTA1M30.bOgpdIs0W6S9ZvGt-l0Lj0CIwBpaO4eIaPRUF75FK-U";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class ChatBot {
  constructor(inputSelector, sendBtnSelector, messagesSelector) {
    this.input = document.querySelector(inputSelector);
    this.sendBtn = document.querySelector(sendBtnSelector);
    this.messages = document.querySelector(messagesSelector);
    this.user = null;
    this.initEvents();
    this.getUserSession();
  }

  async getUserSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) this.user = data.session.user;
  }

  initEvents() {
    this.sendBtn.addEventListener("click", () => this.sendMessage());
    this.input.addEventListener("keypress", e => {
      if (e.key === "Enter") this.sendMessage();
    });
  }

  async sendMessage() {
    const text = this.input.value.trim();
    if (!text || !this.user) return;

    this.addMessage(text, "user");
    this.input.value = "";

    let insertedId = null;
    let botText = "Indisponível no momento.";

    try {
      // 1. Insere mensagem do usuário no Supabase
      const { data, error } = await supabase.from("chat_history")
        .insert([{ user_id: this.user.id, user_message: text, ai_response: "" }])
        .select()
        .single();

      if (error) throw error;
      insertedId = data.id;

      // 2. Gera resposta com o Ollama
      const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_CONFIG.model,
          prompt: "Responda sempre em português: " + text
        })
      });

      if (!response.body) throw new Error("Sem resposta do modelo.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      botText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              botText += parsed.response;
              this.updateLastMessage(botText);
            }
          } catch (err) {
            console.warn("Erro parse:", err);
          }
        }
      }

      // 3. Atualiza resposta da IA no Supabase
      if (insertedId) {
        await supabase.from("chat_history")
          .update({ ai_response: botText })
          .eq("id", insertedId);
      }

    } catch (err) {
      // Mensagem de erro com link clicável e imagem
      const errorHtml = `
        <div class="error-message">
          ⚠️ Erro ao conectar com o Ollama.<br>
<<<<<<< HEAD
          <a href="abrirchamado.html" target="_blank" style="color: #007bff; text-decoration: none;">
            Clique aqui para ver possíveis soluções💡
=======
          <img src="assets/lampada.svg" alt="Dica" width="24" height="24" style="vertical-align: middle; margin-right: 6px;">
          <a href="abrirchamado.html" target="_blank" style="color: #007bff; text-decoration: underline;">
            Clique aqui para ver possíveis soluções
>>>>>>> ab617e377321e5015a4ebb68f93777e5bdd4ca3f
          </a>
        </div>
      `;
      this.addMessage(errorHtml, "bot", true);
      console.error(err);
    }
  }

  addMessage(text, sender, isHtml = false) {
    const div = document.createElement("div");
    div.className = `msg ${sender}`;
    if (isHtml) div.innerHTML = text;
    else div.textContent = text;

    this.messages.appendChild(div);
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  updateLastMessage(text) {
    const last = this.messages.querySelector(".msg.bot:last-child");
    if (last) last.textContent = text;
    else this.addMessage(text, "bot");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ChatBot("#userInput", "#sendBtn", "#messages");
});
