import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://iwiorzjughvsvvfjdodw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aW9yemp1Z2h2c3Z2Zmpkb2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTkwNTMsImV4cCI6MjA3MjMzNTA1M30.bOgpdIs0W6S9ZvGt-l0Lj0CIwBpaO4eIaPRUF75FK-U";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  const descricaoInput = document.getElementById("inputDescricaoChamado");
  const categoriaSelect = document.getElementById("selectCategoriaChamado");
  const prioridadeRadios = document.getElementsByName("radioPrioridade");
  const enviarBtn = document.getElementById("btnEnviarChamado");

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    alert("Você precisa estar logado para abrir um chamado.");
    window.location.href = "login.html";
    return;
  }

  enviarBtn.addEventListener("click", async () => {
    const descricao = descricaoInput.value.trim();
    const categoria = categoriaSelect.value;
    let prioridade = "";
    prioridadeRadios.forEach(radio => {
      if (radio.checked) prioridade = radio.value;
    });

    if (!descricao || !categoria || !prioridade) {
      alert("Preencha todos os campos antes de enviar.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("chamado_history")
        .insert([{
          user_id: user.id,
          descricao,
          categoria,
          prioridade,
          status_chamado: 1
        }])
        .select()
        .single();

      if (error) throw error;

      alert("Chamado enviado com sucesso!");
      descricaoInput.value = "";
      categoriaSelect.value = "";
      prioridadeRadios.forEach(radio => radio.checked = false);

    } catch (err) {
      console.error(err);
      alert("Erro ao enviar chamado: " + err.message);
    }
  });
});