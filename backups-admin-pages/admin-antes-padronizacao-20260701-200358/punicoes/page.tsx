
export default function AdminPunicoesPage() {
  return (
    
      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Campeonato" placeholder="Municipal de Futsal" />
          <Input label="Equipe" placeholder="Unidos" />
          <Input label="Atleta" placeholder="João Silva" />
          <Input label="Motivo" placeholder="Cartão vermelho, denúncia, decisão..." />
          <Input label="Data de início" placeholder="dd/mm/aaaa" />
          <Input label="Data final" placeholder="dd/mm/aaaa" />
          <Input label="Jogos de suspensão" placeholder="Ex.: 2" />
          <Input label="Artigo / regra" placeholder="Art. 214, regulamento..." />
        </div>

        <button className="mt-5 rounded-2xl bg-gradient-to-r from-[#ffd400] via-[#67dd7a] to-[#00bde7] px-6 py-4 font-black text-black">
          Salvar punição
        </button>
      </section>
    
  );
}

function Input({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-white/70">{label}</span>
      <input
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 font-bold text-white outline-none placeholder:text-white/28 focus:border-emerald-300"
      />
    </label>
  );
}
