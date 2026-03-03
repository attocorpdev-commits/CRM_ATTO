import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

export interface DistributionResult {
  vendedor_id: string | null
  status: "assigned" | "queued"
}

/**
 * Distributes a conversation to the available seller with the lowest load ratio.
 * Uses a Postgres RPC with FOR UPDATE SKIP LOCKED to prevent race conditions
 * when multiple webhook events arrive simultaneously.
 *
 * Algorithm: pick active seller with (conversas_ativas / capacidade_maxima) lowest.
 * If all sellers are at capacity, the conversation is placed in 'queued' status.
 */
export async function distributeConversation(
  supabase: SupabaseClient<Database>,
  conversaId: string
): Promise<DistributionResult> {
  // Fetch active sellers ordered by load ratio (least loaded first)
  const { data: sellers, error: fetchError } = await supabase
    .from("vendedores")
    .select("id, conversas_ativas, capacidade_maxima")
    .eq("status", "ativo")
    .order("conversas_ativas", { ascending: true })

  if (fetchError) {
    throw new Error(`Failed to fetch sellers: ${fetchError.message}`)
  }

  if (!sellers || sellers.length === 0) {
    // No active sellers at all — queue the conversation
    await supabase
      .from("conversas_whatsapp")
      .update({ status: "queued", vendedor_id: null })
      .eq("id", conversaId)

    return { vendedor_id: null, status: "queued" }
  }

  // Try each seller in order of load ratio until one succeeds
  for (const seller of sellers) {
    if (seller.conversas_ativas >= seller.capacidade_maxima) continue

    const { error: rpcError } = await supabase.rpc("assign_conversation", {
      p_conversa_id: conversaId,
      p_vendedor_id: seller.id,
    })

    if (!rpcError) {
      // Successfully assigned
      return { vendedor_id: seller.id, status: "assigned" }
    }

    // 'vendor_unavailable' means the RPC's FOR UPDATE SKIP LOCKED found the
    // vendor was already locked or at capacity — try the next one
    if (rpcError.message.includes("vendor_unavailable")) {
      continue
    }

    // Unexpected RPC error
    throw new Error(`Assignment RPC failed: ${rpcError.message}`)
  }

  // All sellers at capacity — queue
  await supabase
    .from("conversas_whatsapp")
    .update({ status: "queued", vendedor_id: null })
    .eq("id", conversaId)

  return { vendedor_id: null, status: "queued" }
}

