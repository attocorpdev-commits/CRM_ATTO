import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-xl font-medium">Página não encontrada</p>
      <p className="text-muted-foreground">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Button asChild>
        <Link href="/">Voltar para o início</Link>
      </Button>
    </div>
  )
}
