"use client"

import { useActionState } from "react"
import { registerAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import { MessageSquare } from "lucide-react"

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, null)

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>Cadastre-se no CRM Atto</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="João Silva"
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              required
              autoComplete="new-password"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
