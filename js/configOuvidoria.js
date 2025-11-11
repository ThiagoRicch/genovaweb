// ../js/configOuvidoria.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔧 ajuste se necessário
const SUPABASE_URL = "https://iwiorzjughvsvvfjdodw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aW9yemp1Z2h2c3Z2Zmpkb2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTkwNTMsImV4cCI6MjA3MjMzNTA1M30.bOgpdIs0W6S9ZvGt-l0Lj0CIwBpaO4eIaPRUF75FK-U";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* -------------------------------------------
   PENDENTES (denuncias_user) — tela principal
   Botão: Enviar para "Em Andamento"
   ------------------------------------------- */
export async function loadDenunciasPendentes(selector = ".table__urgentes") {
  try {
    const { data: denuncias, error } = await supabase
      .from("denuncias_user")
      .select("id, user_id, descricao_denuncias, categoria_denuncias, data_denuncias")
      .order("data_denuncias", { ascending: false });

    if (error) throw error;

    const table = document.querySelector(selector);
    if (!table) return;

    let tbody = table.querySelector("tbody");
    if (!tbody) {
      tbody = document.createElement("tbody");
      table.appendChild(tbody);
    }
    tbody.innerHTML = "";

    denuncias.forEach(item => {
      const tr = document.createElement("tr");
      tr.dataset.id = item.id;
      tr.innerHTML = `
        <td>${item.user_id ?? ""}</td>
        <td>${item.categoria_denuncias}</td>
        <td class="descricao-cell">${item.descricao_denuncias}</td>
        <td>${item.data_denuncias ? new Date(item.data_denuncias).toLocaleString() : ""}</td>
        <td>
          <button class="btn btn-warning btn-enviar-timing" data-id="${item.id}">
            Enviar para Em Andamento
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // ação botão: enviar para tabela timing (em andamento)
    tbody.querySelectorAll(".btn-enviar-timing").forEach(button => {
      button.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        const btn = e.currentTarget;
        const row = btn.closest("tr");

        btn.disabled = true;
        btn.textContent = "Enviando...";

        try {
          // pega registro para preservar data e user_id
          const { data: registro, error: selErr } = await supabase
            .from("denuncias_user")
            .select("user_id, descricao_denuncias, categoria_denuncias, data_denuncias")
            .eq("id", id)
            .single();

          if (selErr) throw selErr;
          if (!registro) throw new Error("Registro não encontrado.");

          // insere em denuncias_timing
          const { error: insErr } = await supabase
            .from("denuncias_timing")
            .insert([{
              user_id: registro.user_id,
              descricao_denuncias: registro.descricao_denuncias,
              categoria_denuncias: registro.categoria_denuncias,
              data_denuncias: registro.data_denuncias,
              status: 2
            }]);

          if (insErr) throw insErr;

          // remove de denuncias_user
          const { error: delErr } = await supabase
            .from("denuncias_user")
            .delete()
            .eq("id", id);

          if (delErr) throw delErr;

          // remove visual
          if (row) row.remove();

          alert("✅ Denúncia enviada para 'Em Andamento' com sucesso.");
        } catch (err) {
          console.error("Erro ao enviar para andamento:", err);
          alert("Erro ao enviar para 'Em Andamento'. Veja o console.");
          btn.disabled = false;
          btn.textContent = "Enviar para Em Andamento";
        }
      });
    });

  } catch (err) {
    console.error("Erro ao carregar denúncias pendentes:", err);
  }
}

/* -------------------------------------------
   TIMING (denuncias_timing) — tela 'Em Andamento'
   Ações: Finalizar (-> denuncias_success) ou Reabrir (-> denuncias_user)
   ------------------------------------------- */
export async function loadDenunciasTiming(selector = ".table__timing") {
  try {
    const { data: denuncias, error } = await supabase
      .from("denuncias_timing")
      .select("id, user_id, descricao_denuncias, categoria_denuncias, data_denuncias, status")
      .order("data_denuncias", { ascending: false });

    if (error) throw error;

    const table = document.querySelector(selector);
    if (!table) return;

    let tbody = table.querySelector("tbody");
    if (!tbody) {
      tbody = document.createElement("tbody");
      table.appendChild(tbody);
    }

    tbody.innerHTML = "";

    denuncias.forEach(item => {
      const tr = document.createElement("tr");
      tr.dataset.id = item.id;
      tr.innerHTML = `
        <td>${item.user_id ?? ""}</td>
        <td>${item.categoria_denuncias}</td>
        <td class="descricao-cell">${item.descricao_denuncias}</td>
        <td>${item.data_denuncias ? new Date(item.data_denuncias).toLocaleString() : ""}</td>
        <td>
          <button class="btn btn-primary btn-finalizar" data-id="${item.id}">Finalizar</button>
          <button class="btn btn-secondary btn-reabrir ms-2" data-id="${item.id}">Reabrir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Finalizar -> move para denuncias_success
    tbody.querySelectorAll(".btn-finalizar").forEach(button => {
      button.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        const btn = e.currentTarget;
        const row = btn.closest("tr");

        btn.disabled = true;
        btn.textContent = "Finalizando...";

        try {
          // pega registro completo
          const { data: registro, error: selErr } = await supabase
            .from("denuncias_timing")
            .select("user_id, descricao_denuncias, categoria_denuncias, data_denuncias")
            .eq("id", id)
            .single();

          if (selErr) throw selErr;

          // insere em success
          const { error: insErr } = await supabase
            .from("denuncias_success")
            .insert([{
              user_id: registro.user_id,
              descricao_denuncias: registro.descricao_denuncias,
              categoria_denuncias: registro.categoria_denuncias,
              data_denuncias: registro.data_denuncias
            }]);

          if (insErr) throw insErr;

          // deleta de timing
          const { error: delErr } = await supabase
            .from("denuncias_timing")
            .delete()
            .eq("id", id);

          if (delErr) throw delErr;

          if (row) row.remove();
          alert("✅ Denúncia finalizada e movida para 'Solucionadas'.");

        } catch (err) {
          console.error("Erro ao finalizar denúncia:", err);
          alert("Erro ao finalizar. Veja o console.");
          btn.disabled = false;
          btn.textContent = "Finalizar";
        }
      });
    });

    // Reabrir -> volta para denuncias_user
    tbody.querySelectorAll(".btn-reabrir").forEach(button => {
      button.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        const btn = e.currentTarget;
        const row = btn.closest("tr");

        btn.disabled = true;
        btn.textContent = "Reabrindo...";

        try {
          const { data: registro, error: selErr } = await supabase
            .from("denuncias_timing")
            .select("user_id, descricao_denuncias, categoria_denuncias, data_denuncias")
            .eq("id", id)
            .single();

          if (selErr) throw selErr;

          // insere de volta em denuncias_user
          const { error: insErr } = await supabase
            .from("denuncias_user")
            .insert([{
              user_id: registro.user_id,
              descricao_denuncias: registro.descricao_denuncias,
              categoria_denuncias: registro.categoria_denuncias,
              data_denuncias: registro.data_denuncias
            }]);

          if (insErr) throw insErr;

          // deleta de timing
          const { error: delErr } = await supabase
            .from("denuncias_timing")
            .delete()
            .eq("id", id);

          if (delErr) throw delErr;

          if (row) row.remove();
          alert("✅ Denúncia reaberta e movida para 'Denúncias'.");

        } catch (err) {
          console.error("Erro ao reabrir denúncia:", err);
          alert("Erro ao reabrir. Veja o console.");
          btn.disabled = false;
          btn.textContent = "Reabrir";
        }
      });
    });

  } catch (err) {
    console.error("Erro ao carregar denúncias em andamento:", err);
  }
}

/* -------------------------------------------
   SOLUCIONADAS (denuncias_success) — tela 'Solucionadas'
   ------------------------------------------- */
export async function loadDenunciasSolucionadas(selector = ".table__success") {
  try {
    const { data: denuncias, error } = await supabase
      .from("denuncias_success")
      .select("id, user_id, descricao_denuncias, categoria_denuncias, data_denuncias")
      .order("data_denuncias", { ascending: false });

    if (error) throw error;

    const table = document.querySelector(selector);
    if (!table) return;

    let tbody = table.querySelector("tbody");
    if (!tbody) {
      tbody = document.createElement("tbody");
      table.appendChild(tbody);
    }

    tbody.innerHTML = "";

    denuncias.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.user_id ?? ""}</td>
        <td>${item.categoria_denuncias}</td>
        <td>${item.descricao_denuncias}</td>
        <td>${item.data_denuncias ? new Date(item.data_denuncias).toLocaleString() : ""}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Erro ao carregar denúncias solucionadas:", err);
  }
}

/* -------------------------------------------
   Inicialização automática: detecta o tipo de tela
   (se houver tabelas com as classes, carrega automaticamente)
   ------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // se existir tabela pendentes (classe usada no seu screenDenuncias.html)
  if (document.querySelector(".table__denuncias")) {
    loadDenunciasPendentes(".table__denuncias");
  }

  // se existir tabela timing
  if (document.querySelector(".table__denuncias_timing")) {
    loadDenunciasTiming(".table__denuncias_timing");
  }

  // se existir tabela success
  if (document.querySelector(".table__denuncias_success")) {
    loadDenunciasSolucionadas(".table__denuncias_success");
  }
});
