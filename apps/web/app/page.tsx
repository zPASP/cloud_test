const entregas = [
  "Arquitetura multi-tenant com Company/Store",
  "Modelagem de catálogo, pedidos, pagamentos e PDV",
  "Fluxo de atendimento/fila e templates WhatsApp",
  "Suporte LGPD, branding e domínio customizado",
  "APIs iniciais para evolução dos módulos",
];

export default function HomePage() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>E-commerce SaaS Multi-Tenant — Versão Base Completa</h1>
      <p>Base técnica consolidada para implementação final dos pedidos do sistema.</p>
      <ul>
        {entregas.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </main>
  );
}
