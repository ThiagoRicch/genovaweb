import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔧 Conexão com o Supabase
const SUPABASE_URL = "https://iwiorzjughvsvvfjdodw.supabase.co"; // substitua pelo seu link
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aW9yemp1Z2h2c3Z2Zmpkb2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTkwNTMsImV4cCI6MjA3MjMzNTA1M30.bOgpdIs0W6S9ZvGt-l0Lj0CIwBpaO4eIaPRUF75FK-U"; // substitua pela sua key pública
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🔹 Função para carregar os chamados de prioridade "não urgente"
async function loadChamadosPorPrioridade(prioridade, tabelaClasse) {
  try {
    const { data: chamados, error } = await supabase
      .from("chamado_history")
      .select("id, descricao, prioridade, categoria")
      .eq("prioridade", prioridade)
      .order("data_chamado", { ascending: false });

    if (error) throw error;

    const table = document.querySelector(tabelaClasse);
    if (!table) return;

    let tbody = table.querySelector("tbody");
    if (!tbody) {
      tbody = document.createElement("tbody");
      table.appendChild(tbody);
    }

    tbody.innerHTML = "";

    chamados.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.prioridade}</td>
        <td>${item.categoria}</td>
        <td>${item.descricao}</td>
        <td>
          <button class="btn btn-success btn-resolver" data-id="${item.id}">
            Resolver Chamado
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Adiciona evento para todos os botões
    tbody.querySelectorAll(".btn-resolver").forEach(button => {
      button.addEventListener("click", async (e) => {
        const idChamado = e.target.getAttribute("data-id");
        const linha = e.target.closest("tr");

        try {
          // Busca o chamado selecionado
          const chamadoSelecionado = chamados.find(c => c.id == idChamado);
          if (!chamadoSelecionado) return;

          // Insere o chamado na tabela chamado_timing
          const { error: insertError } = await supabase
            .from("chamado_timing")
            .insert([{
              descricao: chamadoSelecionado.descricao,
              categoria: chamadoSelecionado.categoria,
              prioridade: chamadoSelecionado.prioridade,
              status_chamado: 2 // Em andamento
            }]);

          if (insertError) throw insertError;

          // Remove o chamado da tabela atual (visual)
          linha.remove();

          // Mostra alerta
          alert("Chamado está em andamento! Foi redirecionado para a seção de 'Em Andamento'.");

          // (Opcional) Remove também da tabela chamado_history
          await supabase
            .from("chamado_history")
            .delete()
            .eq("id", idChamado);

        } catch (err) {
          console.error("Erro ao mover chamado:", err);
          alert("Erro ao mover o chamado para 'Em Andamento'.");
        }
      });
    });

  } catch (err) {
    console.error("Erro ao carregar chamados:", err);
  }
}


async function loadChamadosEmAndamento() {
  try {
    const { data: chamados, error } = await supabase
      .from("chamado_timing")
      .select("id, descricao, categoria, prioridade, status_chamado, data_chamado")
      .eq("status_chamado", 2) // apenas em andamento
      .order("data_chamado", { ascending: false });

    if (error) throw error;

    const table = document.querySelector(".table__timing");
    if (!table) return;

    let tbody = table.querySelector("tbody");
    if (!tbody) {
      tbody = document.createElement("tbody");
      table.appendChild(tbody);
    }

    tbody.innerHTML = "";

    chamados.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.prioridade}</td>
        <td>${item.categoria}</td>
        <td>${item.descricao}</td>
        <td>${new Date(item.data_chamado).toLocaleString()}</td>
        <td>
          <button class="btn btn-primary btn-finalizar" data-id="${item.id}">
            Finalizar Chamado
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Evento de clique no botão "Finalizar Chamado"
    tbody.querySelectorAll(".btn-finalizar").forEach(button => {
      button.addEventListener("click", async (e) => {
        const idChamado = e.target.getAttribute("data-id");
        const linha = e.target.closest("tr");

        try {
          const chamadoSelecionado = chamados.find(c => c.id == idChamado);
          if (!chamadoSelecionado) return;

          // Insere na tabela de chamados solucionados
          const { error: insertError } = await supabase
            .from("chamado_success")
            .insert([{
              descricao: chamadoSelecionado.descricao,
              categoria: chamadoSelecionado.categoria,
              prioridade: chamadoSelecionado.prioridade,
              status_chamado: 3 // Solucionado
            }]);

          if (insertError) throw insertError;

          // Deleta da tabela de andamento
          await supabase
            .from("chamado_timing")
            .delete()
            .eq("id", idChamado);

          // Remove a linha da tabela na tela
          linha.remove();

          alert("✅ Chamado finalizado com sucesso! Ele foi movido para 'Chamados Solucionados'.");

        } catch (err) {
          console.error("Erro ao finalizar chamado:", err);
          alert("Erro ao finalizar chamado.");
        }
      });
    });

  } catch (err) {
    console.error("Erro ao carregar chamados em andamento:", err);
  }
}


async function loadChamadosSuccess() {
  try {
    const { data: chamados, error } = await supabase
      .from("chamado_success")
      .select("descricao, prioridade, categoria, data_chamado")
      .order("data_chamado", { ascending: false }); 

    if (error) throw error;

    const table = document.querySelector(".table__success");
    if (!table) return;

    let tbody = table.querySelector("tbody");
    if (!tbody) {
      tbody = document.createElement("tbody");
      table.appendChild(tbody);
    }

    tbody.innerHTML = "";

    chamados.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.prioridade}</td>
        <td>${item.categoria}</td>
        <td>${item.descricao}</td>
        <td>${new Date(item.data_chamado).toLocaleString()}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Erro ao carregar chamados solucionados:", err);
  }
}

// 🔄 Carrega automaticamente ao abrir a página
document.addEventListener("DOMContentLoaded", () => {
  loadChamadosEmAndamento();
  loadChamadosPorPrioridade("Não Urgente", ".table__nao__urgentes");
  loadChamadosPorPrioridade("Pouco Urgente", ".table__pouco__urgentes");
  loadChamadosPorPrioridade("Urgente", ".table__urgentes");
});

document.addEventListener("DOMContentLoaded", loadChamadosSuccess);
document.addEventListener("DOMContentLoaded", loadChamadosTiming);
