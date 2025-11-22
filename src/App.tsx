import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { MainLayout } from "@/components/layout/MainLayout"
import { Login } from "@/pages/Login"
import { Swap } from "@/pages/Swap"
import { CreateVault } from "@/pages/CreateVault"
import { Vaults } from "@/pages/Vaults"
import { VaultDetail } from "@/pages/VaultDetail"
import { Landing } from "@/pages/Landing"
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Landing />} />
          <Route path="/landingpage" element={<Landing />} />
          <Route
            path="/swap"
            element={
              <MainLayout>
                <Swap />
              </MainLayout>
            }
          />
          <Route
            path="/create-vault"
            element={
              <MainLayout>
                <CreateVault />
              </MainLayout>
            }
          />
          <Route
            path="/vaults"
            element={
              <MainLayout maxWidth="full">
                <Vaults />
              </MainLayout>
            }
          />
          <Route
            path="/vaults/:address"
            element={
              <MainLayout>
                <VaultDetail />
              </MainLayout>
            }
          />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

