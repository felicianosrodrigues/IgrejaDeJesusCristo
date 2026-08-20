import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Church } from "lucide-react";
import { api, formatApiError } from "../lib/api";
import { fileToDataUrl } from "../lib/image";
import { lookupCep, normalizeCep } from "../lib/cep";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const AUTH_BG =
  "https://images.pexels.com/photos/14530767/pexels-photo-14530767.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Register() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [addressForm, setAddressForm] = useState({
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        photo_url: photoUrl,
        ...addressForm,
      });
      setUser(data);
      navigate("/", { replace: true });
    } catch (err) {
      setError(formatApiError(err, "Não foi possível criar a conta."));
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      setPhotoUrl(await fileToDataUrl(file));
    } catch (err) {
      setError(err.message || "Não foi possível ler a imagem selecionada.");
    }
  };

  const handleCepLookup = async () => {
    try {
      if (normalizeCep(addressForm.cep).length !== 8) return;
      const result = await lookupCep(addressForm.cep);
      setAddressForm((current) => ({ ...current, ...result }));
    } catch (err) {
      setError(err.message || "Não foi possível consultar o CEP.");
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background" data-testid="register-page">
      <div className="relative hidden md:block">
        <img src={AUTH_BG} alt="Comunidade reunida em oração" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="overline-label !text-white/70">Igreja de Jesus Cristo</p>
          <h1 className="font-display text-4xl lg:text-5xl font-semibold mt-3 leading-tight">
            Faça parte da nossa família em Cristo.
          </h1>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-sm" data-testid="register-form">
          <div className="flex items-center gap-2 mb-8">
            <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Church size={20} />
            </span>
            <span className="font-display text-2xl font-semibold text-primary">Igreja de Jesus Cristo</span>
          </div>
          <h2 className="font-display text-4xl font-semibold tracking-tight">Crie sua conta</h2>
          <p className="text-muted-foreground text-sm mt-2 mb-8">Cadastre-se para participar dos murais, agenda e contribuições.</p>

          {error && (
            <div data-testid="register-error" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                data-testid="register-name-input"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                data-testid="register-email-input"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                data-testid="register-password-input"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="photo_url">Foto (arquivo opcional)</Label>
              <Input
                id="photo_url"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                data-testid="register-photo-input"
                className="mt-1.5"
              />
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt="Pré-visualização da foto"
                  className="mt-3 h-20 w-20 rounded-full object-cover border border-border"
                />
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:col-span-2">
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={addressForm.cep}
                  onChange={(e) => setAddressForm((current) => ({ ...current, cep: normalizeCep(e.target.value) }))}
                  onBlur={handleCepLookup}
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="00000000"
                  data-testid="register-cep-input"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="rua">Rua</Label>
                <Input
                  id="rua"
                  value={addressForm.rua}
                  onChange={(e) => setAddressForm((current) => ({ ...current, rua: e.target.value }))}
                  data-testid="register-rua-input"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={addressForm.numero}
                  onChange={(e) => setAddressForm((current) => ({ ...current, numero: e.target.value }))}
                  data-testid="register-numero-input"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={addressForm.complemento}
                  onChange={(e) => setAddressForm((current) => ({ ...current, complemento: e.target.value }))}
                  data-testid="register-complemento-input"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={addressForm.bairro}
                  onChange={(e) => setAddressForm((current) => ({ ...current, bairro: e.target.value }))}
                  data-testid="register-bairro-input"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={addressForm.cidade}
                  onChange={(e) => setAddressForm((current) => ({ ...current, cidade: e.target.value }))}
                  data-testid="register-cidade-input"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={addressForm.estado}
                  onChange={(e) => setAddressForm((current) => ({ ...current, estado: e.target.value }))}
                  data-testid="register-estado-input"
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={handleCepLookup} className="rounded-full w-full">
                  Buscar CEP
                </Button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            data-testid="register-submit-button"
            className="w-full mt-6 rounded-full h-11 bg-primary hover:bg-primary/90 active:scale-95 transition-transform duration-100"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
          <p className="text-sm text-muted-foreground text-center mt-6">
            Já tem conta?{" "}
            <Link to="/login" data-testid="go-to-login-link" className="text-primary font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
