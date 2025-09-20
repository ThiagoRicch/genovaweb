import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { OLLAMA_CONFIG } from "./config.js";

export const SUPABASE_URL = "https://iwiorzjughvsvvfjdodw.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aW9yemp1Z2h2c3Z2Zmpkb2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTkwNTMsImV4cCI6MjA3MjMzNTA1M30.bOgpdIs0W6S9ZvGt-l0Lj0CIwBpaO4eIaPRUF75FK-U";

export const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class GenovaApp {
  constructor() {
    this.client = client;
    this.user = null;
    this.init();
    this.getUserSession(); // garante que o usuário seja setado logo
  }

  init() {
    document.addEventListener("DOMContentLoaded", async () => {
      if (window.location.pathname.includes("profile.html")) {
        await this.showUser();
        await this.loadChatHistory();
        this.listenChatHistory(); // atualização em tempo real
        this.addLogoutEvents();
      }
    });

    window.register = () => this.register();
    window.login = () => this.login();
    window.logout = () => this.logout();
    window.sendMessageToGenova = (message) => this.sendMessageToGenova(message);
  }

  async register() {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();

    if (!firstName || !lastName || !email || !password) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const { data, error } = await this.client.auth.signUp({ email, password });
      if (error) throw error;

      const userId = data.user?.id;
      if (userId) {
        await this.client.from("profiles").insert([
          { id: userId, first_name: firstName, last_name: lastName }
        ]);
      }

      alert("Cadastro realizado!");
      window.location.href = "login.html";
    } catch (err) {
      alert("Erro ao registrar: " + err.message);
    }
  }

  async login() {
    const email = document.getElementById("logEmail").value.trim();
    const password = document.getElementById("logPassword").value.trim();
    if (!email || !password) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const { error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "index.html";
    } catch (err) {
      alert("Erro ao logar: " + err.message);
    }
  }

  async logout() {
    await this.client.auth.signOut();
    window.location.href = "login.html";
  }

  async getUserSession() {
    const { data: { session } } = await this.client.auth.getSession();
    this.user = session?.user || null;
    return this.user;
  }

  async showUser() {
    const user = await this.getUserSession();
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const { data: profile } = await this.client.from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    document.getElementById("welcomeMsg").innerText = `Olá, ${profile.first_name} ${profile.last_name}! 🎉`;
    document.getElementById("userInfo").innerText = `Você está logado como: ${user.email}`;
  }

  async loadChatHistory() {
    if (!this.user) await this.getUserSession();
    if (!this.user) return;

    const { data: history, error } = await this.client.from("chat_history")
      .select("*")
      .eq("user_id", this.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar histórico:", error);
      return;
    }

    const tbody = document.querySelector("#chatHistory tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    history.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.user_message}</td>
        <td>${item.ai_response}</td>
        <td>${new Date(item.created_at).toLocaleString()}</td>`;
      tbody.appendChild(tr); // mantém ordem do banco
    });
  }

  listenChatHistory() {
    if (!this.user) return;

    this.client.channel("chat_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_history", filter: `user_id=eq.${this.user.id}` },
        payload => {
          const item = payload.new;
          const tbody = document.querySelector("#chatHistory tbody");
          if (!tbody) return;

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${item.user_message}</td>
            <td>${item.ai_response}</td>
            <td>${new Date(item.created_at).toLocaleString()}</td>`;
          tbody.prepend(tr); // mostra sempre no topo
        }
      )
      .subscribe();
  }

  addLogoutEvents() {
    const logoutBtn = document.getElementById("btnLogout");
    if (logoutBtn) logoutBtn.addEventListener("click", () => this.logout());

    const logoutCardBtn = document.querySelector(".btn-danger");
    if (logoutCardBtn) logoutCardBtn.addEventListener("click", () => this.logout());
  }

  async sendMessageToGenova(message) {
    if (!message.trim()) return;
    if (!this.user) await this.getUserSession();
    if (!this.user) return;

    let userMessageId;
    let aiResponse = "Indisponível no momento.";

    try {
      const { data } = await this.client.from("chat_history")
        .insert([{ user_id: this.user.id, user_message: message, ai_response: "" }])
        .select()
        .single();

      userMessageId = data.id;

      const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_CONFIG.model,
          prompt: "Responda sempre em português: " + message
        })
      });

      if (!response.body) throw new Error("Sem resposta do modelo.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      aiResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) aiResponse += parsed.response;
          } catch (err) {
            console.warn("Erro parse:", err);
          }
        }
      }
    } catch (err) {
      console.error("Erro no envio:", err);
    }

    if (userMessageId) {
      await this.client.from("chat_history")
        .update({ ai_response: aiResponse })
        .eq("id", userMessageId);
    }
  }
}

// Inicializa
new GenovaApp();
