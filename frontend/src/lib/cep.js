export function normalizeCep(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 8);
}

export async function lookupCep(value) {
  const cep = normalizeCep(value);
  if (cep.length !== 8) {
    throw new Error("Informe um CEP válido com 8 dígitos.");
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) {
    throw new Error("Não foi possível consultar o CEP.");
  }

  const data = await response.json();
  if (data.erro) {
    throw new Error("CEP não encontrado.");
  }

  return {
    cep,
    rua: data.logradouro || "",
    bairro: data.bairro || "",
    cidade: data.localidade || "",
    estado: data.uf || "",
    complemento: data.complemento || "",
  };
}
