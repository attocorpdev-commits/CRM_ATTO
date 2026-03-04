export function isAdminOrAbove(role?: string): boolean {
  return role === "admin" || role === "superadmin"
}

export function getRoleLabel(role?: string): string {
  switch (role) {
    case "superadmin": return "Superadmin"
    case "admin":      return "Admin"
    default:           return "Vendedor"
  }
}
