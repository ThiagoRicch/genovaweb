import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../js/script.js";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
    const descricaoInputDenuncias = document.getElementById("InputDenuncias");
    const categoriaSelectDenuncias = document.getElementById("SelectDenuncias");
    const btnEnviarDenuncias = document.getElementById("ButtonSendDenuncias");

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
        alert("Você precisa estar logado para abrir um chamado.");
        window.location.href = "index.html";
        return;
    }

    btnEnviarDenuncias.addEventListener("click", async () => {
        const descricao = descricaoInputDenuncias.value.trim();
        const categoria = categoriaSelectDenuncias.value;

        if (!descricao || !categoria) {
            alert("Preencha todos os campos antes de enviar.");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("denuncias_user")
                .insert([{
                    user_id: user.id,
                    descricao_denuncias: descricao,
                    categoria_denuncias: categoria,
                }])
                .select()
                .single();

            if (error) throw error;

            alert("Denuncia enviada com sucesso!");
            descricaoInputDenuncias.value = "";
            categoriaSelectDenuncias.value = "";

        } catch (err) {
            console.error(err);
            alert("Erro ao enviar a Denúncia: " + err.message);
        }
    });
});