# Wave - Setup Guide

## 🚀 Application Structure

The application has been created with a modular structure and reusable atomic components.

### 📁 Directory Structure

```
src/
├── components/
│   ├── atomic/          # Reusable atomic components
│   │   ├── Container.tsx
│   │   └── CenteredLayout.tsx
│   ├── layout/          # Layout components
│   │   ├── Header.tsx
│   │   └── MainLayout.tsx
│   ├── swap/            # Swap interface components
│   │   ├── SwapInterface.tsx
│   │   └── TokenSelector.tsx
│   ├── vault/           # Vault management components
│   │   ├── CreateVaultWizard.tsx
│   │   ├── TokenMultiSelect.tsx
│   │   └── VaultActions.tsx
│   └── ui/              # shadcn/ui components with glass variants
│
├── pages/               # Route pages
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── CreateVault.tsx
│   ├── Vaults.tsx
│   └── VaultDetail.tsx
│
└── lib/                 # Utilities
    └── utils.ts
```

## 🎨 Design System

### Glassmorphism Components

All shadcn/ui components support glassmorphism variants:

- **Card**: `variant="glass" | "glass-strong" | "glass-apple"`
- **Button**: `variant="glass" | "glass-apple"`
- **Input**: `variant="glass"`
- **Textarea**: `variant="glass"`
- **Dialog**: `variant="glass" | "glass-apple"`
- **Select**: `variant="glass" | "glass-apple"` (on SelectContent)

### CSS Utility Classes

Utility classes available in `src/index.css`:

- `.glass` - Standard glass effect
- `.glass-strong` - Stronger glass effect
- `.glass-apple` - Apple-style liquid glass
- `.glass-hover` - Hover effect for glass components

## 🔐 Routing

The application uses React Router with protected routes:

- `/login` - Login/registration page
- `/dashboard` - Main dashboard with swap
- `/create-vault` - Wizard to create vault
- `/vaults` - List of all vaults
- `/vaults/:address` - Vault detail with deposit/withdraw

## 📦 Main Dependencies

- `react-router-dom` - Routing
- `@factordao/tokenlist` - Token list and metadata
- `shadcn/ui` - UI components
- `wagmi` + `@rainbow-me/rainbowkit` - Web3 integration
- `@tanstack/react-query` - Data fetching

## 🔧 Environment Variables

Make sure you have in the `.env` file:

```env
VITE_STATS_API_BASE_URL=your_api_url
VITE_NPM_TOKEN=your_npm_token (if needed)
```

## 🎯 Implemented Features

### ✅ Login/Registration
- Login page with wallet connection
- Automatic redirect to dashboard when connected

### ✅ Dashboard
- Uniswap-like swap interface
- Token selector with search
- Input with glass effect

### ✅ Create Vault Wizard
- Step 1: Basic Info (name with prefix "ethGlobal - wave: ")
- Step 2: Fees (deposit, withdraw, management)
- Step 3: Whitelisted Tokens (multi-select with chips)
- Step 4: Review and deploy
- Automatic pair generation from selected tokens

### ✅ Vaults List
- Fetch from `VITE_STATS_API_BASE_URL/strategies`
- Automatic filter for vaults with name starting with "ethGlobal - wave: "
- Search bar to filter vaults
- Card with glass effect

### ✅ Vault Detail
- Complete vault information
- Deposit/Withdraw tabs
- Token selector for deposit/withdraw
- Transaction preview

## 🚧 TODO - SDK Integrations

The following features require SDK integration:

1. **Create Vault Wizard** - Step 4: Deploy vault
   - Integrate with `@factordao/sdk-studio` for deployment
   - Implement multiple transactions (deploy, configure, etc.)

2. **Vault Actions** - Deposit/Withdraw
   - Integrate with `useProVaultDeposit` and `useProVaultWithdraw`
   - Handle token approvals
   - Show accurate preview

3. **Swap Interface**
   - Integrate with Aqua SDK for swap simulation
   - Calculate output amount
   - Handle multi-hop routing

## 🎨 Styling

The app uses:
- **Tailwind CSS** for styling
- **Glassmorphism effects** for all components
- **Gradient backgrounds** for the main layout
- **Rounded corners** (rounded-full for buttons, rounded-lg for cards)

## 📝 Notes

- All vault names must start with "ethGlobal - wave: " to be recognized
- Tokens are loaded from `@factordao/tokenlist` using the current chainId
- The app is responsive and optimized for mobile




