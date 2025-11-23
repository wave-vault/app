# Setup Alchemy RPC per Base

## Problema
Stai ricevendo errori **429 (Too Many Requests)** su `https://mainnet.base.org/` perché il RPC pubblico di Base ha limiti di rate molto bassi.

## Soluzione: Usa Alchemy

Alchemy fornisce un RPC gratuito e affidabile con limiti di rate molto più alti.

---

## 📝 Passaggi per Configurare Alchemy

### 1. Crea un Account Alchemy (Gratuito)

1. Vai su [https://www.alchemy.com/](https://www.alchemy.com/)
2. Clicca su "Sign Up" (registrazione gratuita)
3. Completa la registrazione

### 2. Crea una Nuova App

1. Dopo il login, clicca su "Create new app" o "Apps" nel menu
2. Compila il form:
   - **Name**: Wave App (o qualsiasi nome)
   - **Description**: Liquidity as a Service platform
   - **Chain**: **Base**
   - **Network**: **Base Mainnet**
3. Clicca su "Create app"

### 3. Ottieni l'API Key

1. Nella dashboard delle app, clicca sulla tua app appena creata
2. Clicca su "API Key" o "View Key"
3. Copia l'**API Key** (una stringa tipo: `AbCdEf123456789...`)

### 4. Configura Localmente (Sviluppo)

Crea il file `.env` nella root del progetto:

```bash
# Nella cartella app/
cp .env.example .env
```

Apri `.env` e aggiungi la tua API key:

```env
VITE_ALCHEMY_API_KEY=la_tua_api_key_di_alchemy_qui
```

### 5. Configura su Vercel (Produzione)

#### Opzione A: Vercel Dashboard (Consigliato)

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto `wave-aqua`
3. Vai su **Settings** → **Environment Variables**
4. Clicca su **Add New**
5. Aggiungi:
   - **Name**: `VITE_ALCHEMY_API_KEY`
   - **Value**: La tua API key di Alchemy
   - **Environments**: Seleziona **Production**, **Preview**, **Development**
6. Clicca su **Save**
7. **Rideploy** l'applicazione (vai su Deployments → Latest → ... → Redeploy)

#### Opzione B: Vercel CLI

```bash
# Se hai Vercel CLI installato
vercel env add VITE_ALCHEMY_API_KEY
# Inserisci la tua API key quando richiesto
# Seleziona tutti gli ambienti (Production, Preview, Development)

# Rideploy
vercel --prod
```

---

## ✅ Verifica che Funzioni

Dopo aver configurato l'API key:

### In Locale:

1. Riavvia il server di sviluppo:
```bash
pnpm dev
```

2. Apri la console del browser
3. Dovresti vedere:
```
[RPC] Using Alchemy RPC: https://base-mainnet.g.alchemy.com/v2/***
```

4. **Non dovresti più vedere** errori `429 (Too Many Requests)`

### In Produzione (Vercel):

1. Dopo il rideploy, apri il sito: `https://[tuo-url].vercel.app/vaults`
2. Apri DevTools (F12) → Console
3. Verifica il log: `[RPC] Using Alchemy RPC`
4. Le vaults dovrebbero caricare senza errori 429

---

## 📊 Limiti Gratuiti di Alchemy

Con il piano gratuito di Alchemy ottieni:
- ✅ **300M compute units al mese** (più che sufficienti)
- ✅ **RPC più veloce e affidabile**
- ✅ **Nessun limite di rate come il RPC pubblico**

---

## 🔒 Sicurezza

**Importante**: 
- ❌ **NON** committare il file `.env` nel repository (è già in `.gitignore`)
- ✅ Usa variabili d'ambiente sia in locale che in produzione
- ✅ L'API key di Alchemy è visibile nel codice client (è normale per app frontend)
- ✅ Alchemy permette di configurare "Allowed Origins" per limitare l'uso dell'API key

### Configurare Allowed Origins (Opzionale ma Consigliato):

1. Nel dashboard Alchemy, vai sulla tua app
2. Clicca su **Settings** o **Configure**
3. Trova **Allowed Origins** o **HTTP Restrictions**
4. Aggiungi:
   - `http://localhost:5174` (sviluppo)
   - `https://[tuo-dominio].vercel.app` (produzione)
5. Salva

---

## 🐛 Troubleshooting

### "No VITE_ALCHEMY_API_KEY found" in Console

✅ **Soluzione**: 
- Verifica che il file `.env` esista nella root del progetto
- Verifica che la variabile sia scritta correttamente: `VITE_ALCHEMY_API_KEY=...`
- Riavvia il server di sviluppo (`pnpm dev`)

### Ancora errori 429 su Vercel

✅ **Soluzione**:
- Verifica che la variabile d'ambiente sia configurata correttamente su Vercel
- Assicurati di aver fatto il **rideploy** dopo aver aggiunto la variabile
- Controlla che tutti e 3 gli ambienti (Production, Preview, Development) siano selezionati

### "Invalid API Key" da Alchemy

✅ **Soluzione**:
- Verifica di aver copiato l'intera API key (senza spazi)
- Ricontrolla che la chain sia **Base** (non Ethereum)
- Ricontrolla che il network sia **Base Mainnet**

---

## 📚 Link Utili

- [Alchemy Dashboard](https://dashboard.alchemy.com/)
- [Alchemy Base Documentation](https://docs.alchemy.com/reference/base-api-quickstart)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Nota**: Questa configurazione risolve completamente gli errori 429 che stai riscontrando. Il RPC pubblico di Base ha limiti molto severi, mentre Alchemy offre un servizio molto più affidabile e performante.

