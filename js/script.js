import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { OLLAMA_CONFIG } from "./config.js";

// ==================== CONFIGURAÇÕES SUPABASE ====================
export const SUPABASE_URL = "https://iwiorzjughvsvvfjdodw.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aW9yemp1Z2h2c3Z2Zmpkb2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTkwNTMsImV4cCI6MjA3MjMzNTA1M30.bOgpdIs0W6S9ZvGt-l0Lj0CIwBpaO4eIaPRUF75FK-U";
export const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class GenovaApp {
  constructor() {
    this.client = client;
    this.user = null;
    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", async () => {
      await this.getUserSession();

      const path = window.location.pathname;

      if (path.includes("profile.html")) {
        await this.showProfile();
        const btnSalvar = document.getElementById("btnAlterarPerfil");
        if (btnSalvar) btnSalvar.addEventListener("click", () => this.updateProfile());
        this.addLogoutEvents();

      } else if (path.includes("historicoIA.html")) {
        await this.showUser();
        await this.loadChatHistory();
        this.listenChatHistory();
        this.addLogoutEvents();

      } else if (path.includes("historicochamados.html")) {
        await this.showUser();
        await this.loadChamadosHistory();
        this.listenChamadosHistory();
        this.addChamadoEvents();
        this.addLogoutEvents();

      } else if (path.includes("historicodenuncias.html")) {
        await this.showUser();
        await this.loadHistoryDenuncias(); // carregamento inicial
        this.listenDenuncias();            // escuta em tempo real
        this.addLogoutEvents();
        this.addDenunciaEvents();
      }
      else {
        this.addLogoutEvents();
      }
    });

    // Disponibiliza globalmente
    window.register = () => this.register();
    window.login = () => this.login();
    window.logout = () => this.logout();
    window.sendMessageToGenova = (message) => this.sendMessageToGenova(message);
  }

  // ==================== SESSÃO DO USUÁRIO ====================
  async getUserSession() {
    const { data: { session } } = await this.client.auth.getSession();
    this.user = session?.user || null;
    return this.user;
  }

  // ==================== PERFIL ====================
  async showProfile() {
    const user = this.user || await this.getUserSession();
    if (!user) { window.location.href = "index.html"; return; }

    try {
      const { data: profile, error } = await this.client
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;

      document.getElementById("InputCarregarNome").value = profile?.first_name || "";
      document.getElementById("inputCarregarSobrenome").value = profile?.last_name || "";
      document.getElementById("inputCarregarEmail").value = user.email || "";

    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
    }
  }

  async updateProfile() {
  const user = this.user || (await this.getUserSession());
  if (!user) {
    alert("Usuário não autenticado.");
    return;
  }

  const firstName = document.getElementById("InputCarregarNome")?.value.trim();
  const lastName = document.getElementById("inputCarregarSobrenome")?.value.trim();
  const email = document.getElementById("inputCarregarEmail")?.value.trim().toLowerCase();

  if (!firstName || !lastName || !email) {
    alert("Preencha todos os campos!");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Digite um e-mail válido!");
    return;
  }

  try {
    const { error: profileError } = await this.client
      .from("profiles")
      .update({ first_name: firstName, last_name: lastName })
      .eq("id", user.id);

    if (profileError) throw profileError;

    if (email && email !== user.email) {
      await this.client.auth.refreshSession();
      const { error: authError } = await this.client.auth.updateUser({ email });
      if (authError) throw authError;
    }

    alert("Perfil atualizado com sucesso!");
  } catch (err) {
    alert("Erro ao atualizar perfil: " + err.message);
    console.error(err);
  }
}

  // ==================== LOGIN / REGISTRO ====================
 async register() {
  const firstName = document.getElementById("firstName")?.value.trim();
  const lastName = document.getElementById("lastName")?.value.trim();
  const email = document.getElementById("regEmail")?.value.trim();
  const password = document.getElementById("regPassword")?.value.trim();

  const checkTermos = document.getElementById("checkTermos")?.checked;
  const checkPrivacidade = document.getElementById("checkPrivacidade")?.checked;
  const checkAnonimo = document.getElementById("checkAnonimo")?.checked;

  if (!firstName || !lastName || !email || !password) {
    alert("Preencha todos os campos!");
    return;
  }

  // ✅ Verificação obrigatória dos direitos legais
  if (!checkTermos || !checkPrivacidade || !checkAnonimo) {
    alert("Você deve concordar com os Termos de Uso e a Política de Privacidade para continuar.");
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

    alert("Cadastro realizado com sucesso!");
    window.location.href = "index.html";
  } catch (err) {
    alert("Erro ao registrar: " + err.message);
  }
}


  async login() {
    const email = document.getElementById("logEmail")?.value.trim();
    const password = document.getElementById("logPassword")?.value.trim();

    if (!email || !password) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Atualiza sessão/usuário local
    await this.getUserSession();

    // 🔹 Define os e-mails especiais
    const ADMIN_EMAIL = "genovasupport@gmail.com";
    const OUVIDORIA_EMAIL = "genovaouvidoria@gmail.com";

    const lower = email.toLowerCase();

    // Redirecionamento único e claro
    if (lower === ADMIN_EMAIL.toLowerCase()) {
      window.location.href = "../screenSupport.html";
      return;
    } else if (lower === OUVIDORIA_EMAIL.toLowerCase()) {
      window.location.href = "../screenOuvidoria.html";
      return;
    } else {
      window.location.href = "../home.html";
      return;
    }

  } catch (err) {
    alert("Erro ao logar: " + err.message);
    console.error("Login error:", err);
  }
}
  async logout() {
    await this.client.auth.signOut();
    window.location.href = "index.html";
  }

  // ==================== MOSTRAR USUÁRIO ====================
  async showUser() {
    const user = this.user || await this.getUserSession();
    if (!user) { window.location.href = "index.html"; return; }

    try {
      const { data: profile, error } = await this.client.from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;

      document.getElementById("welcomeMsg").innerText = `Olá, ${profile.first_name} ${profile.last_name}! 🎉`;
      document.getElementById("userInfo").innerText = `Você está logado como: ${user.email}`;
    } catch (err) {
      console.error("Erro ao mostrar usuário:", err);
    }
  }

  // ==================== HISTÓRICO DE CHAT ====================
  async loadChatHistory() {
    const user = this.user || await this.getUserSession();
    if (!user) return;

    try {
      const { data: history, error } = await this.client.from("chat_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const tbody = document.querySelector("#chatHistory tbody");
      if (!tbody) return;

      tbody.innerHTML = "";
      history.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.user_message}</td>
          <td>${item.ai_response}</td>
          <td>${new Date(item.created_at).toLocaleString()}</td>`;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("Erro ao carregar histórico de chat:", err);
    }
  }

  listenChatHistory() {
    const user = this.user;
    if (!user) return;

    this.client.channel("chat_history_channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_history", filter: `user_id=eq.${user.id}` },
        payload => {
          const item = payload.new;
          const tbody = document.querySelector("#chatHistory tbody");
          if (!tbody) return;

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${item.user_message}</td>
            <td>${item.ai_response}</td>
            <td>${new Date(item.created_at).toLocaleString()}</td>`;
          tbody.prepend(tr);
        }
      ).subscribe();
  }


  // ==================== HISTÓRICO DE CHAMADOS ====================
  async loadChamadosHistory() {
  const user = this.user || await this.getUserSession();
  if (!user) return;

  try {
    const { data: chamados, error } = await this.client.from("chamado_history")
      .select("*")
      .eq("user_id", user.id)
      .order("data_chamado", { ascending: false });

    if (error) throw error;

    const tbody = document.querySelector("#chamadosHistory tbody");
    const table = document.querySelector("#chamadosHistory");
    if (!tbody) return;

    tbody.innerHTML = "";

    // Mensagem motivadora
    if (!chamados || chamados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            🌟 Não está vendo mais seu chamado aqui!?<br>
            Não esquente! Com certeza os técnicos da <strong>Genova</strong> estão solucionando! 🔧💡
          </td>
        </tr>`;
      return;
    }

    chamados.forEach(item => {
      const tr = document.createElement("tr");
      tr.dataset.id = item.id;
      tr.innerHTML = `
        <td><input type="text" class="form-control form-control-sm" value="${item.descricao}"></td>
        <td><input type="text" class="form-control form-control-sm" value="${item.categoria}"></td>
        <td><input type="text" class="form-control form-control-sm" value="${item.prioridade}"></td>
        <td>${new Date(item.data_chamado).toLocaleString()}</td>
        <td>
          <button class="btn btn-success btn-sm btn-edit">Alterar</button>
          <button class="btn btn-danger btn-sm btn-delete">Excluir</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar histórico de chamados:", err);
  }
}


  listenChamadosHistory() {
    const user = this.user;
    if (!user) return;

    this.client.channel("chamado_history_channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chamado_history", filter: `user_id=eq.${user.id}` },
        payload => {
          const item = payload.new;
          const tbody = document.querySelector("#chamadosHistory tbody");
          if (!tbody) return;

          const tr = document.createElement("tr");
          tr.dataset.id = item.id;
          tr.innerHTML = `
            <td><input type="text" class="form-control form-control-sm" value="${item.descricao}"></td>
            <td><input type="text" class="form-control form-control-sm" value="${item.categoria}"></td>
            <td><input type="text" class="form-control form-control-sm" value="${item.prioridade}"></td>
            <td>${new Date(item.data_chamado).toLocaleString()}</td>
            <td>
              <button class="btn btn-success btn-sm btn-edit">Alterar</button>
              <button class="btn btn-danger btn-sm btn-delete">Excluir</button>
            </td>`;
          tbody.prepend(tr);
        }
      ).subscribe();
  }

  // ==================== EVENTOS DE EDIÇÃO/EXCLUSÃO ====================
  addChamadoEvents() {
    const tbody = document.querySelector("#chamadosHistory tbody");
    if (!tbody) return;

    tbody.addEventListener("click", async (e) => {
      const tr = e.target.closest("tr");
      const id = tr?.dataset.id;
      if (!tr || !id) return;

      // EDITAR
      if (e.target.classList.contains("btn-edit")) {
        const descricao = tr.querySelector("td:nth-child(1) input")?.value.trim();
        const categoria = tr.querySelector("td:nth-child(2) input")?.value.trim();
        const prioridade = tr.querySelector("td:nth-child(3) input")?.value.trim();

        try {
          await this.client.from("chamado_history")
            .update({ descricao, categoria, prioridade })
            .eq("id", id);
          alert("Chamado atualizado com sucesso!");
        } catch (err) {
          console.error("Erro ao atualizar chamado:", err);
          alert("Erro ao atualizar chamado");
        }
      }

      // EXCLUIR
      if (e.target.classList.contains("btn-delete")) {
        const confirmDel = confirm("Você tem certeza que deseja excluir este registro?");
        if (!confirmDel) return; // CANCELAR não faz nada

        try {
          await this.client.from("chamado_history")
            .delete()
            .eq("id", id);
          tr.remove();
        } catch (err) {
          console.error("Erro ao excluir chamado:", err);
          alert("Erro ao excluir chamado");
        }
      }
    });
  }

  // ==================== CARREGAR HISTÓRICO DE DENÚNCIAS ====================
async loadHistoryDenuncias() {
  const user = this.user || await this.getUserSession();
  if (!user) return;

  try {
    const { data: history, error } = await this.client.from("denuncias_user")
      .select("*")
      .eq("user_id", user.id)
      .order("data_denuncias", { ascending: false });

    if (error) throw error;

    const tbody = document.querySelector("#chamadosDenuncias tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!history || history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            Você ainda não fez nenhuma denúncia.<br>
            Sua voz é importante para nós! 📢
          </td>
        </tr>`;
      return;
    }
    history.forEach(item => {
      const tr = document.createElement("tr");
      tr.dataset.id = item.id; // ESSENCIAL para edição/exclusão
      tr.innerHTML = `
        <td><input type="text" class="form-control form-control-sm" value="${item.descricao_denuncias}"></td>
        <td><input type="text" class="form-control form-control-sm" value="${item.categoria_denuncias}"></td>
        <td>
          <button class="btn btn-success btn-sm btn-edit">Alterar</button>
          <button class="btn btn-danger btn-sm btn-delete">Excluir</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar histórico de denúncias:", err);
  }
}

// ==================== ESCUTAR NOVAS DENÚNCIAS EM TEMPO REAL ====================
listenDenuncias() {
  const user = this.user;
  if (!user) return;

  this.client.channel("denuncias_channel")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "denuncias_user",
        filter: `user_id=eq.${user.id}`
      },
      payload => {
        const item = payload.new;
        const tbody = document.querySelector("#chamadosDenuncias tbody");
        if (!tbody) return;

        const tr = document.createElement("tr");
        tr.dataset.id = item.id;
        tr.innerHTML = `
          <td><input type="text" class="form-control form-control-sm" value="${item.descricao_denuncias}"></td>
          <td><input type="text" class="form-control form-control-sm" value="${item.categoria_denuncias}"></td>
          <td>
            <button class="btn btn-success btn-sm btn-edit">Alterar</button>
            <button class="btn btn-danger btn-sm btn-delete">Excluir</button>
          </td>`;
        tbody.prepend(tr);
      }
    ).subscribe();
}

// ==================== EDIÇÃO E EXCLUSÃO DE DENÚNCIAS ====================
addDenunciaEvents() {
  const tbody = document.querySelector("#chamadosDenuncias tbody");
  if (!tbody) return;

  tbody.addEventListener("click", async (e) => {
    const tr = e.target.closest("tr");
    const id = tr?.dataset.id;
    if (!tr || !id) return;

    // EDITAR
    if (e.target.classList.contains("btn-edit")) {
      const descricao = tr.querySelector("td:nth-child(1) input")?.value.trim();
      const categoria = tr.querySelector("td:nth-child(2) input")?.value.trim();

      if (!descricao || !categoria) {
        alert("Preencha todos os campos antes de atualizar!");
        return;
      }

      try {
        await this.client.from("denuncias_user")
          .update({ descricao_denuncias: descricao, categoria_denuncias: categoria })
          .eq("id", id);
        alert("Denúncia atualizada com sucesso!");
      } catch (err) {
        console.error("Erro ao atualizar denúncia:", err);
        alert("Erro ao atualizar denúncia");
      }
    }

    // EXCLUIR
    if (e.target.classList.contains("btn-delete")) {
      const confirmDel = confirm("Você tem certeza que deseja excluir esta denúncia?");
      if (!confirmDel) return;

      try {
        await this.client.from("denuncias_user")
          .delete()
          .eq("id", id);
        tr.remove();
      } catch (err) {
        console.error("Erro ao excluir denúncia:", err);
        alert("Erro ao excluir denúncia");
      }
    }
  });
}

  // ==================== GENOVA IA ====================
  async sendMessageToGenova(message) {
    if (!message.trim()) return;
    const user = this.user || await this.getUserSession();
    if (!user) return;

    let userMessageId;
    let aiResponse = "Indisponível no momento.";

    try {
      const { data } = await this.client.from("chat_history")
        .insert([{ user_id: user.id, user_message: message, ai_response: "" }])
        .select()
        .single();
      userMessageId = data.id;

      const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: OLLAMA_CONFIG.model, prompt: "Responda sempre em português: " + message })
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
      console.error("Erro ao enviar mensagem:", err);
    }

    if (userMessageId) {
      await this.client.from("chat_history")
        .update({ ai_response: aiResponse })
        .eq("id", userMessageId);
    }
  }

  // ==================== LOGOUT ====================
  addLogoutEvents() {
    const logoutBtn = document.getElementById("btnSairProfile"); // ID exclusivo para logout
    if (logoutBtn) logoutBtn.addEventListener("click", () => this.logout());

    const logoutCardBtn = document.getElementById("btnSairProfile"); // ID exclusivo para logout
    if (logoutCardBtn) logoutCardBtn.addEventListener("click", () => this.logout());

    const logoutExtraBtn = document.getElementById("btnSaiProfile"); // ID exclusivo para logout
    if (logoutExtraBtn) logoutExtraBtn.addEventListener("click", () => this.logout());
  }
}

// ==================== INSTÂNCIA ====================
new GenovaApp();